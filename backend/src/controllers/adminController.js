const store = require('../data/store');

// Helper to format employee credentials strictly as employee_name@spysalon.com and username@123
const generateEmployeeCredentialsFormat = (rawName, providedEmail) => {
  const cleanName = (rawName || 'employee').toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  const username = cleanName || 'stylist';
  const email = (providedEmail && providedEmail.includes('@spysalon.com')) ? providedEmail.toLowerCase() : `${username}@spysalon.com`;
  const tempPassword = `${username}@123`;
  return { username, email, tempPassword };
};

// ================= ANALYTICS & REPORTS =================
exports.getAnalytics = async (req, res) => {
  const stats = store.getAnalyticsStats();
  return res.status(200).json({
    success: true,
    data: stats
  });
};

// ================= AUDIT ACTIVITY LOGS & NOTIFICATIONS =================
exports.getActivityLogs = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: store.activityLogs.length,
    data: store.activityLogs
  });
};

exports.getNotifications = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: store.notifications.length,
    unreadCount: store.notifications.filter(n => !n.read).length,
    data: store.notifications
  });
};

// ================= EMPLOYEE MANAGEMENT =================
exports.getEmployees = async (req, res) => {
  let list = store.employees.map(emp => {
    const creds = generateEmployeeCredentialsFormat(emp.name, emp.email);
    return {
      ...emp,
      empCode: emp.empCode || 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      email: creds.email,
      username: creds.username,
      tempPassword: emp.tempPassword || creds.tempPassword
    };
  });

  const { search, status, specialty } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.empCode && e.empCode.toLowerCase().includes(q)));
  }

  if (status && status !== 'All') {
    list = list.filter(e => e.status.toLowerCase() === status.toLowerCase());
  }

  if (specialty) {
    list = list.filter(e => e.specialties && e.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase())));
  }

  return res.status(200).json({ success: true, count: list.length, data: list });
};

exports.getEmployeeById = async (req, res) => {
  const emp = store.employees.find(e => e._id === req.params.id || e.empCode === req.params.id);
  if (emp) {
    const empCode = emp.empCode || 'EMP-1001';
    const creds = generateEmployeeCredentialsFormat(emp.name, emp.email);
    const email = creds.email;
    const username = creds.username;
    const tempPassword = emp.tempPassword || creds.tempPassword;

    return res.status(200).json({
      success: true,
      data: { ...emp, empCode, email, username, tempPassword },
      credentials: { empCode, email, username, tempPassword }
    });
  }
  return res.status(404).json({ success: false, message: 'Employee profile not found' });
};

exports.createEmployee = async (req, res) => {
  const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
  const creds = generateEmployeeCredentialsFormat(req.body.name, req.body.email);

  const newEmp = {
    _id: 'emp_' + Date.now(),
    empCode,
    name: req.body.name,
    email: creds.email,
    username: creds.username,
    tempPassword: creds.tempPassword,
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    phone: req.body.phone || '+91 98765 00000',
    specialties: req.body.specialties || ['Senior Specialist'],
    services: req.body.services || ['Salon Service'],
    workingHours: req.body.workingHours || { start: '09:00', end: '19:00' },
    breakTime: req.body.breakTime || { start: '13:00', end: '14:00' },
    slotIntervalMinutes: req.body.slotIntervalMinutes || 30,
    status: 'Active',
    createdAt: new Date()
  };

  store.employees.unshift(newEmp);

  store.logActivity('Employee Created', `Created staff record for ${newEmp.name} (${empCode}). Credentials issued: ${creds.email} / ${creds.tempPassword}`);
  store.addNotification('New Staff Specialist Onboarded', `${newEmp.name} joined. Login: ${creds.email}`, 'success');

  return res.status(201).json({
    success: true,
    message: `Employee created! Credentials Generated: Email: ${creds.email}, Password: ${creds.tempPassword}`,
    data: newEmp,
    credentials: { empCode, email: creds.email, username: creds.username, tempPassword: creds.tempPassword }
  });
};

exports.updateEmployee = async (req, res) => {
  const idx = store.employees.findIndex(e => e._id === req.params.id);
  if (idx !== -1) {
    const empCode = store.employees[idx].empCode || 'EMP-1001';
    const creds = generateEmployeeCredentialsFormat(req.body.name || store.employees[idx].name, req.body.email || store.employees[idx].email);

    store.employees[idx] = {
      ...store.employees[idx],
      ...req.body,
      empCode,
      email: creds.email,
      username: creds.username,
      tempPassword: creds.tempPassword
    };

    store.logActivity('Employee Updated', `Updated credentials for ${store.employees[idx].name}: ${creds.email} / ${creds.tempPassword}`);

    return res.status(200).json({
      success: true,
      message: 'Employee updated and credentials verified!',
      data: store.employees[idx],
      credentials: { empCode, email: creds.email, username: creds.username, tempPassword: creds.tempPassword }
    });
  }
  return res.status(404).json({ success: false, message: 'Employee not found' });
};

exports.deleteEmployee = async (req, res) => {
  const idx = store.employees.findIndex(e => e._id === req.params.id);
  if (idx !== -1) {
    const deletedName = store.employees[idx].name;
    store.employees.splice(idx, 1);
    store.logActivity('Employee Deleted', `Removed employee record for ${deletedName}`);
    store.addNotification('Staff Removed', `Employee record for ${deletedName} was deleted.`, 'warning');
  }
  return res.status(200).json({ success: true, data: {} });
};

// ================= CUSTOMER MANAGEMENT =================
exports.getCustomers = async (req, res) => {
  let list = [...store.customers];
  const { search, membership } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
  }

  if (membership) {
    list = list.filter(c => c.membership.toLowerCase().includes(membership.toLowerCase()));
  }

  return res.status(200).json({ success: true, count: list.length, data: list });
};

exports.createCustomer = async (req, res) => {
  const newCust = { _id: 'cust_' + Date.now(), visits: 1, totalSpend: 0, membership: 'Standard', status: 'Active', ...req.body };
  store.customers.unshift(newCust);
  store.logActivity('Customer Created', `Registered new customer ${newCust.name}`);
  return res.status(201).json({ success: true, data: newCust });
};

exports.updateCustomer = async (req, res) => {
  const idx = store.customers.findIndex(c => c._id === req.params.id);
  if (idx !== -1) {
    store.customers[idx] = { ...store.customers[idx], ...req.body };
    store.logActivity('Customer Updated', `Updated customer account ${store.customers[idx].name}`);
    return res.status(200).json({ success: true, data: store.customers[idx] });
  }
  return res.status(404).json({ success: false, message: 'Customer not found' });
};

exports.deleteCustomer = async (req, res) => {
  const idx = store.customers.findIndex(c => c._id === req.params.id);
  if (idx !== -1) {
    const name = store.customers[idx].name;
    store.customers.splice(idx, 1);
    store.logActivity('Customer Deleted', `Deleted customer record for ${name}`);
  }
  return res.status(200).json({ success: true, message: 'Customer deleted' });
};

// ================= SERVICES & PRICING MANAGEMENT =================
exports.getAdminServices = async (req, res) => {
  let list = [...store.services];
  const { search, category } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  }

  if (category && category !== 'All') {
    list = list.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  return res.status(200).json({ success: true, count: list.length, data: list });
};

exports.createService = async (req, res) => {
  const newSrv = {
    _id: 'srv_' + Date.now(),
    id: String(Date.now()),
    rating: 5.0,
    isActive: true,
    image: req.body.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
    ...req.body
  };
  store.services.unshift(newSrv);
  store.logActivity('Service Created', `Added new salon service: ${newSrv.name} (₹${newSrv.price})`);
  store.addNotification('Service Menu Updated', `New service '${newSrv.name}' published to booking menu.`, 'info');
  return res.status(201).json({ success: true, data: newSrv });
};

exports.updateService = async (req, res) => {
  const idx = store.services.findIndex(s => s._id === req.params.id || s.id === req.params.id);
  if (idx !== -1) {
    store.services[idx] = { ...store.services[idx], ...req.body };
    store.logActivity('Service Updated', `Updated pricing/details for service: ${store.services[idx].name}`);
    return res.status(200).json({ success: true, data: store.services[idx] });
  }
  return res.status(404).json({ success: false, message: 'Service not found' });
};

exports.deleteService = async (req, res) => {
  const idx = store.services.findIndex(s => s._id === req.params.id || s.id === req.params.id);
  if (idx !== -1) {
    const name = store.services[idx].name;
    store.services.splice(idx, 1);
    store.logActivity('Service Deleted', `Removed service: ${name}`);
  }
  return res.status(200).json({ success: true, message: 'Service deleted' });
};

// ================= APPOINTMENT MANAGEMENT =================
exports.getAdminAppointments = async (req, res) => {
  let list = [...store.appointments];
  const { search, status, paymentMethod } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => a.customerName.toLowerCase().includes(q) || a.bookingId.toLowerCase().includes(q) || a.service.toLowerCase().includes(q));
  }

  if (status && status !== 'All') {
    list = list.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  if (paymentMethod && paymentMethod !== 'All') {
    list = list.filter(a => a.paymentMethod.toLowerCase() === paymentMethod.toLowerCase());
  }

  return res.status(200).json({ success: true, count: list.length, data: list });
};

exports.createAdminAppointment = async (req, res) => {
  const bookingId = 'SPY-' + Math.floor(100000 + Math.random() * 900000);
  const newApp = { _id: 'app_' + Date.now(), bookingId, status: 'Confirmed', paymentStatus: 'Paid', ...req.body };
  store.appointments.unshift(newApp);
  store.logActivity('Walk-In Appointment Created', `Booked appointment ${bookingId} for ${newApp.customerName}`);
  store.addNotification('New Booking Locked', `Walk-in appointment ${bookingId} confirmed.`, 'success');
  return res.status(201).json({ success: true, data: newApp });
};

exports.updateAppointmentStatus = async (req, res) => {
  const idx = store.appointments.findIndex(a => a._id === req.params.id);
  if (idx !== -1) {
    const prev = store.appointments[idx];
    const updated = { ...prev, ...req.body };

    if (req.body.adminNote) {
      updated.adminNote = req.body.adminNote;
    }

    store.appointments[idx] = updated;

    if (req.body.status === 'Confirmed') {
      store.logActivity('Appointment Confirmed', `Admin confirmed booking ${updated.bookingId} for ${updated.customerName} (${updated.appointmentDate} at ${updated.appointmentTime})`);
      store.addNotification('Slot Confirmed 🟢', `Appointment ${updated.bookingId} for ${updated.customerName} on ${updated.appointmentDate} at ${updated.appointmentTime} is confirmed.`, 'success');
      store.addUserNotification(
        updated.customerPhone,
        updated.customerEmail,
        'Appointment Confirmed 🟢',
        `Your appointment ${updated.bookingId} for ${updated.service} on ${updated.appointmentDate} at ${updated.appointmentTime} is confirmed!`,
        'success'
      );
    } else if (req.body.status === 'Reschedule Requested') {
      store.logActivity('Reschedule Requested', `Admin requested time change for ${updated.bookingId}. Note: "${req.body.adminNote || 'Please choose another slot'}"`);
      store.addNotification('Time Slot Reschedule Requested ⚠️', `Reschedule note sent to ${updated.customerName} (${updated.customerPhone}) for booking ${updated.bookingId}: ${req.body.adminNote}`, 'warning');
      store.addUserNotification(
        updated.customerPhone,
        updated.customerEmail,
        'Time Slot Reschedule Requested ⚠️',
        `Booking ${updated.bookingId}: ${req.body.adminNote || 'The requested slot is unavailable. Please select another time slot.'}`,
        'warning'
      );
    } else {
      store.logActivity('Appointment Updated', `Booking ${updated.bookingId} status changed to ${updated.status}`);
    }

    return res.status(200).json({ success: true, data: store.appointments[idx] });
  }
  return res.status(404).json({ success: false, message: 'Appointment not found' });
};

exports.deleteAppointment = async (req, res) => {
  const idx = store.appointments.findIndex(a => a._id === req.params.id);
  if (idx !== -1) {
    const id = store.appointments[idx].bookingId;
    store.appointments.splice(idx, 1);
    store.logActivity('Appointment Cancelled', `Cancelled booking ${id}`);
  }
  return res.status(200).json({ success: true, message: 'Appointment cancelled' });
};

// ================= LEAVES, ATTENDANCE & REVIEWS =================
exports.getLeaves = async (req, res) => res.status(200).json({ success: true, data: store.leaves });

exports.createLeave = async (req, res) => {
  const newLeave = {
    _id: 'leave_' + Date.now(),
    employeeName: req.body.employeeName || 'Ananya Sharma',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || new Date().toISOString().split('T')[0],
    reason: req.body.reason || 'Personal Leave',
    status: 'Pending'
  };
  store.leaves.unshift(newLeave);
  store.logActivity('Leave Application Submitted', `Leave request for ${newLeave.employeeName}`);
  store.addNotification('New Leave Request', `${newLeave.employeeName} submitted a leave request.`, 'warning');
  return res.status(201).json({ success: true, data: newLeave });
};

exports.updateLeaveStatus = async (req, res) => {
  const idx = store.leaves.findIndex(l => l._id === req.params.id);
  if (idx !== -1) {
    const oldStatus = store.leaves[idx].status;
    const newStatus = req.body.status || 'Approved';
    store.leaves[idx].status = newStatus;
    store.logActivity('Leave Request Status Updated', `${newStatus} leave request for ${store.leaves[idx].employeeName}`);
    store.addNotification('Leave Request Update', `Leave application for ${store.leaves[idx].employeeName} was marked as ${newStatus}.`, newStatus === 'Approved' ? 'success' : 'warning');
    return res.status(200).json({ success: true, data: store.leaves[idx] });
  }
  return res.status(404).json({ success: false, message: 'Leave record not found' });
};

exports.deleteLeave = async (req, res) => {
  const idx = store.leaves.findIndex(l => l._id === req.params.id);
  if (idx !== -1) {
    const empName = store.leaves[idx].employeeName;
    store.leaves.splice(idx, 1);
    store.logActivity('Leave Record Removed', `Cancelled/deleted leave record for ${empName}`);
    return res.status(200).json({ success: true, message: 'Leave record deleted' });
  }
  return res.status(404).json({ success: false, message: 'Leave record not found' });
};

exports.getAttendance = async (req, res) => res.status(200).json({ success: true, data: store.attendance });
exports.recordAttendance = async (req, res) => {
  const rec = { _id: 'att_' + Date.now(), date: new Date().toISOString().split('T')[0], status: 'Present', ...req.body };
  store.attendance.unshift(rec);
  store.logActivity('Attendance Recorded', `Recorded shift entrance for ${rec.employeeName}`);
  return res.status(201).json({ success: true, data: rec });
};

exports.getReviews = async (req, res) => res.status(200).json({ success: true, data: store.reviews });
exports.deleteReview = async (req, res) => {
  const idx = store.reviews.findIndex(r => r._id === req.params.id);
  if (idx !== -1) {
    const cust = store.reviews[idx].customerName;
    store.reviews.splice(idx, 1);
    store.logActivity('Review Moderated', `Deleted comment by ${cust}`);
  }
  return res.status(200).json({ success: true, message: 'Review deleted' });
};

// ================= EXPORT DATA REPORT (CSV GENERATOR) =================
exports.exportData = async (req, res) => {
  const { module: moduleName } = req.params;
  let csvContent = '';

  if (moduleName === 'employees') {
    csvContent = 'Employee ID,Name,Email,Phone,Specialties,Status\n';
    store.employees.forEach(e => {
      csvContent += `"${e.empCode || e._id}","${e.name}","${e.email}","${e.phone}","${e.specialties.join('; ')}","${e.status}"\n`;
    });
  } else if (moduleName === 'appointments') {
    csvContent = 'Booking ID,Customer,Phone,Service,Specialist,Date,Time,Payment Method,Status\n';
    store.appointments.forEach(a => {
      csvContent += `"${a.bookingId}","${a.customerName}","${a.customerPhone}","${a.service}","${a.specialistName}","${a.appointmentDate}","${a.appointmentTime}","${a.paymentMethod}","${a.status}"\n`;
    });
  } else if (moduleName === 'services') {
    csvContent = 'Service Name,Category,Price (INR),Discount Price (INR),Duration (Mins)\n';
    store.services.forEach(s => {
      csvContent += `"${s.name}","${s.category}",${s.price},${s.discountPrice || s.price},${s.durationMinutes}\n`;
    });
  } else {
    csvContent = 'Customer Name,Email,Phone,Visits,Total Spend (INR),Membership\n';
    store.customers.forEach(c => {
      csvContent += `"${c.name}","${c.email}","${c.phone}",${c.visits},${c.totalSpend},"${c.membership}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=spy_salon_${moduleName}_report.csv`);
  return res.status(200).send(csvContent);
};

// ================= PAYROLLS & SALARY SLIPS MANAGEMENT =================
exports.getPayrolls = async (req, res) => {
  return res.status(200).json({ success: true, count: store.payrolls.length, data: store.payrolls });
};

exports.createPayroll = async (req, res) => {
  const { employeeName, month, baseSalary, incentives, deductions, paymentMethod } = req.body;
  const emp = store.employees.find(e => e.name === employeeName) || store.employees[0];
  
  const base = Number(baseSalary || 45000);
  const inc = Number(incentives || 5000);
  const ded = Number(deductions || 1000);
  const net = base + inc - ded;

  const newSlip = {
    _id: 'pay_' + Date.now(),
    slipId: 'PAY-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
    employeeId: emp ? emp._id : 'emp1',
    employeeName: employeeName || (emp ? emp.name : 'Staff Specialist'),
    empCode: emp ? (emp.empCode || 'EMP-1001') : 'EMP-1001',
    month: month || 'July 2026',
    baseSalary: base,
    incentives: inc,
    deductions: ded,
    netPay: net,
    paymentMethod: paymentMethod || 'Bank Transfer (HDFC)',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Paid'
  };

  store.payrolls.unshift(newSlip);
  store.logActivity('Salary Slip Issued', `Generated salary slip for ${newSlip.employeeName} (${newSlip.month}) - Net Pay: ₹${newSlip.netPay}`);
  store.addNotification('Payroll Disbursed', `Salary slip issued for ${newSlip.employeeName} (${newSlip.month}).`, 'success');

  return res.status(201).json({ success: true, data: newSlip });
};

exports.updatePayrollStatus = async (req, res) => {
  const idx = store.payrolls.findIndex(p => p._id === req.params.id);
  if (idx !== -1) {
    if (req.body.status) store.payrolls[idx].status = req.body.status;
    return res.status(200).json({ success: true, data: store.payrolls[idx] });
  }
  return res.status(404).json({ success: false, message: 'Payroll record not found' });
};

exports.deletePayroll = async (req, res) => {
  const idx = store.payrolls.findIndex(p => p._id === req.params.id);
  if (idx !== -1) {
    store.payrolls.splice(idx, 1);
  }
  return res.status(200).json({ success: true, message: 'Payroll record deleted' });
};
