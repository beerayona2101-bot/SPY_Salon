/**
 * Production-Level Employee Controller for SPY Salon Enterprise REST API
 */
const store = require('../data/store');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

exports.getAssignedAppointments = async (req, res, next) => {
  try {
    const appointments = store.appointments || [];
    return ApiResponse.success(res, appointments, 'Assigned appointments retrieved');
  } catch (error) {
    next(error);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, notes, paymentMethod } = req.body;
    const idx = store.appointments.findIndex(a => String(a._id) === String(req.params.id) || String(a.bookingId) === String(req.params.id));
    if (idx === -1) throw ApiError.notFound('Appointment not found');

    const app = store.appointments[idx];
    if (status) app.status = status;
    if (paymentStatus) app.paymentStatus = paymentStatus;
    if (paymentMethod) app.paymentMethod = paymentMethod;
    if (notes !== undefined) app.notes = notes;

    // Cash / Online Payment Confirmation Workflow
    if (paymentStatus === 'Paid' || status === 'Completed') {
      app.paymentStatus = 'Paid';

      // Update Ledger & Customer Total Spend
      const srvMatch = store.services.find(s => s.name === app.service);
      const amount = srvMatch ? srvMatch.price : 1499;

      store.addTransaction(
        'Credited',
        'Appointment Payment',
        `Cash / Counter Payment #${app.bookingId} - ${app.customerName} (${app.service})`,
        amount,
        app.paymentMethod || 'Cash',
        'Completed'
      );

      const custIdx = store.customers.findIndex(c => (app.customerEmail && c.email.toLowerCase() === app.customerEmail.toLowerCase()) || (app.customerPhone && c.phone.includes(app.customerPhone)));
      if (custIdx !== -1) {
        store.customers[custIdx].totalSpend = (store.customers[custIdx].totalSpend || 0) + amount;
        store.customers[custIdx].visits = (store.customers[custIdx].visits || 0) + 1;
      }

      // Notifications
      store.addNotification(
        'Payment Received 💵',
        `Payment of ₹${amount} for #${app.bookingId} (${app.customerName}) marked as Paid via ${app.paymentMethod || 'Cash'}.`,
        'success'
      );

      store.addUserNotification(
        app.customerPhone,
        app.customerEmail,
        'Payment Confirmed ✅',
        `Your payment of ₹${amount} for appointment #${app.bookingId} has been confirmed. Thank you!`,
        'success'
      );

      store.logActivity('Payment Confirmed', `Payment of ₹${amount} for #${app.bookingId} confirmed as Paid.`);
    } else {
      store.logActivity('Appointment Status Changed', `Employee updated #${app.bookingId} status to ${status || app.status}.`);
    }

    const { broadcastEvent } = require('../utils/socket');
    broadcastEvent('appointment:updated', app);
    broadcastEvent('stats:updated', store.getAnalyticsStats());

    return ApiResponse.success(res, app, 'Appointment updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.clockInAttendance = async (req, res, next) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];
    const empName = req.body.employeeName || 'Ananya Sharma';

    // If there is already an active 'In Progress' shift today, return it without creating duplicates
    const existingActive = store.attendance.find(a => a.date === todayStr && a.clockOut === 'In Progress');
    if (existingActive) {
      return ApiResponse.success(res, existingActive, `Shift already in progress (Clocked in at ${existingActive.clockIn})`);
    }

    const newRec = {
      _id: `eatt_${Date.now()}`,
      employeeName: empName,
      date: todayStr,
      clockIn: timeStr,
      clockOut: 'In Progress',
      status: 'Present'
    };

    store.attendance.unshift(newRec);
    store.logActivity('Staff Clock In', `${empName} clocked in for shift at ${timeStr}.`);

    return ApiResponse.created(res, newRec, `Clocked in at ${timeStr}!`);
  } catch (error) {
    next(error);
  }
};

exports.clockOutAttendance = async (req, res, next) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];
    const empName = req.body.employeeName || 'Ananya Sharma';

    let updatedCount = 0;
    store.attendance = store.attendance.map(a => {
      if (a.date === todayStr && (a.clockOut === 'In Progress' || !a.clockOut)) {
        updatedCount++;
        return { ...a, clockOut: timeStr, status: 'Present' };
      }
      return a;
    });

    if (updatedCount === 0 && store.attendance.length > 0) {
      const firstToday = store.attendance.find(a => a.date === todayStr);
      if (firstToday) {
        firstToday.clockOut = timeStr;
      }
    }

    store.logActivity('Staff Clock Out', `${empName} clocked out of shift at ${timeStr}.`);

    return ApiResponse.success(res, { clockOut: timeStr, date: todayStr }, `Clocked out at ${timeStr}!`);
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeAttendance = async (req, res, next) => {
  try {
    return ApiResponse.success(res, store.attendance, 'Attendance log retrieved');
  } catch (error) {
    next(error);
  }
};

exports.submitLeaveRequest = async (req, res, next) => {
  try {
    const { startDate, endDate, reason, employeeName } = req.body;
    if (!startDate || !endDate || !reason) {
      throw ApiError.badRequest('Please provide start date, end date, and reason');
    }

    const newLeave = {
      _id: `leave_${Date.now()}`,
      employeeName: employeeName || 'Ananya Sharma',
      startDate,
      endDate,
      reason,
      status: 'Pending'
    };

    store.leaves.unshift(newLeave);
    return ApiResponse.created(res, newLeave, 'Leave request submitted successfully!');
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeLeaves = async (req, res, next) => {
  try {
    return ApiResponse.success(res, store.leaves, 'Leave history retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getEmployeePayrolls = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (email) {
      const emp = store.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
      if (emp) {
        const list = store.payrolls.filter(p => p.employeeId === emp._id || p.employeeName.toLowerCase() === emp.name.toLowerCase());
        return ApiResponse.success(res, list, 'Employee salary slips retrieved');
      }
    }
    return ApiResponse.success(res, store.payrolls, 'All salary slips retrieved');
  } catch (error) {
    next(error);
  }
};

exports.updateBankDetails = async (req, res, next) => {
  try {
    const { email, accountName, accountNumber, ifscCode, bankName, upiId } = req.body;
    const idx = store.employees.findIndex(e => (email && e.email.toLowerCase() === email.toLowerCase()) || e._id === req.body.employeeId);
    
    const bankData = {
      accountName: accountName || (idx !== -1 ? store.employees[idx].name : 'Staff Specialist'),
      accountNumber: accountNumber || '50100293849201',
      ifscCode: ifscCode || 'HDFC0001234',
      bankName: bankName || 'HDFC Bank, Jubilee Hills',
      upiId: upiId || 'staff@upi'
    };

    if (idx !== -1) {
      store.employees[idx].bankDetails = bankData;
      store.logActivity('Bank Details Updated', `Staff ${store.employees[idx].name} updated bank & UPI payout details.`);
    } else if (store.employees.length > 0) {
      store.employees[0].bankDetails = bankData;
    }

    return ApiResponse.success(res, bankData, 'Bank & UPI payout details saved successfully!');
  } catch (error) {
    next(error);
  }
};

exports.createEmployeeWalkIn = async (req, res, next) => {
  try {
    const { customerName, customerPhone, service, specialistName, appointmentTime, paymentMethod, notes } = req.body;
    if (!customerName || !customerPhone || !service) {
      throw ApiError.badRequest('Please provide customer name, phone, and service');
    }

    const bookingId = `SPY-${Math.floor(100000 + Math.random() * 900000)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const now = new Date();
    const bookingDateTime = now.toISOString();
    const bookingDateStr = now.toISOString().split('T')[0];
    const bookingTimeFormattedStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newApp = {
      _id: `app_${Date.now()}`,
      bookingId,
      customerName,
      customerPhone,
      service,
      specialistName: specialistName || 'Ananya Sharma (Senior Hair Stylist)',
      branch: 'Jubilee Hills Flagship',
      bookingDateTime,
      bookingDate: bookingDateStr,
      bookingTimeFormatted: bookingTimeFormattedStr,
      appointmentDate: todayStr,
      appointmentTime: appointmentTime || 'Immediate Walk-In',
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: 'Paid',
      status: 'In Progress',
      notes: notes || 'Direct Walk-In Client added by Stylist Desk.',
      createdAt: bookingDateTime,
      updatedAt: bookingDateTime
    };

    store.appointments.unshift(newApp);

    store.logActivity(
      'Employee Walk-In Added',
      `Stylist recorded walk-in appointment ${bookingId} for ${customerName} (${service})`
    );

    return ApiResponse.created(res, newApp, 'Walk-in appointment recorded successfully!');
  } catch (error) {
    next(error);
  }
};
