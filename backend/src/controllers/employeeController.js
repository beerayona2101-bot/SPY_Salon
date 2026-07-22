const store = require('../data/store');

// Get Assigned Appointments for Employee (Reads central live appointments)
exports.getAssignedAppointments = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: store.appointments.length,
    data: store.appointments
  });
};

// Update Appointment Service Status & Notes (In Progress, Completed, Cancelled)
exports.updateAppointmentStatus = async (req, res) => {
  const { status, notes } = req.body;
  const idx = store.appointments.findIndex(a => a._id === req.params.id);
  if (idx !== -1) {
    if (status) store.appointments[idx].status = status;
    if (notes !== undefined) store.appointments[idx].notes = notes;
    return res.status(200).json({ success: true, message: 'Status updated successfully', data: store.appointments[idx] });
  }
  return res.status(404).json({ success: false, message: 'Appointment not found' });
};

// Clock-in / Clock-out Attendance
exports.clockInAttendance = async (req, res) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const todayStr = now.toISOString().split('T')[0];

  const newRec = {
    _id: 'eatt_' + Date.now(),
    employeeName: req.body.employeeName || 'Ananya Sharma',
    date: todayStr,
    clockIn: timeStr,
    clockOut: 'In Progress',
    status: 'Present'
  };

  store.attendance.unshift(newRec);
  return res.status(201).json({ success: true, message: `Clocked in at ${timeStr}!`, data: newRec });
};

// Get Employee Attendance Log
exports.getEmployeeAttendance = async (req, res) => {
  return res.status(200).json({ success: true, data: store.attendance });
};

// Submit New Leave Request (Reflects in Admin Leave Desk instantly)
exports.submitLeaveRequest = async (req, res) => {
  const { startDate, endDate, reason, employeeName } = req.body;
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason.' });
  }

  const newLeave = {
    _id: 'leave_' + Date.now(),
    employeeName: employeeName || 'Ananya Sharma',
    startDate,
    endDate,
    reason,
    status: 'Pending'
  };

  store.leaves.unshift(newLeave);
  return res.status(201).json({ success: true, message: 'Leave request submitted successfully!', data: newLeave });
};

// Get Employee Leaves
exports.getEmployeeLeaves = async (req, res) => {
  return res.status(200).json({ success: true, data: store.leaves });
};

// Get Employee Payrolls / Salary Slips
exports.getEmployeePayrolls = async (req, res) => {
  const { email } = req.query;
  if (email) {
    const emp = store.employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (emp) {
      const list = store.payrolls.filter(p => p.employeeId === emp._id || p.employeeName.toLowerCase() === emp.name.toLowerCase());
      return res.status(200).json({ success: true, count: list.length, data: list });
    }
  }
  return res.status(200).json({ success: true, count: store.payrolls.length, data: store.payrolls });
};

// Update Employee Bank & UPI Payout Details
exports.updateBankDetails = async (req, res) => {
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
    return res.status(200).json({ success: true, message: 'Bank & UPI payout details saved successfully!', data: bankData });
  }

  store.employees[0].bankDetails = bankData;
  return res.status(200).json({ success: true, message: 'Bank & UPI payout details saved successfully!', data: bankData });
};

// Add Walk-In Client Appointment from Stylist / Employee Queue
exports.createEmployeeWalkIn = async (req, res) => {
  const { customerName, customerPhone, service, specialistName, appointmentTime, paymentMethod, notes } = req.body;
  if (!customerName || !customerPhone || !service) {
    return res.status(400).json({ success: false, message: 'Please provide customer name, phone, and service.' });
  }

  const bookingId = 'SPY-' + Math.floor(100000 + Math.random() * 900000);
  const todayStr = new Date().toISOString().split('T')[0];

  const newApp = {
    _id: 'app_' + Date.now(),
    bookingId,
    customerName,
    customerPhone,
    service,
    specialistName: specialistName || 'Ananya Sharma (Senior Hair Stylist)',
    branch: 'Jubilee Hills Flagship',
    appointmentDate: todayStr,
    appointmentTime: appointmentTime || 'Immediate Walk-In',
    paymentMethod: paymentMethod || 'Cash',
    paymentStatus: 'Paid',
    status: 'In Progress',
    notes: notes || 'Direct Walk-In Client added by Stylist Desk.'
  };

  store.appointments.unshift(newApp);

  store.logActivity(
    'Employee Walk-In Added',
    `Stylist recorded walk-in appointment ${bookingId} for ${customerName} (${service})`
  );

  store.addNotification(
    'Walk-In Client Seated ✂️',
    `Walk-in client ${customerName} seated for ${service} with ${newApp.specialistName}. Status: In Progress.`,
    'info'
  );

  return res.status(201).json({ success: true, message: 'Walk-in appointment recorded successfully!', data: newApp });
};
