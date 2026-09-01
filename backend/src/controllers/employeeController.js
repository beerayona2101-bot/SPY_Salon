/**
 * Production-Level Employee Controller for SPY Salon Enterprise REST API & Realtime Sync
 */
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { broadcastEvent } = require('../utils/socket');

// Retrieve assigned appointments for logged-in specialist
exports.getAssignedAppointments = async (req, res, next) => {
  try {
    const employeeName = (req.user.name || '').trim();
    const employeeEmail = (req.user.email || '').toLowerCase().trim();
    const employeeId = req.user._id ? req.user._id.toString() : '';

    // Find Employee details record by _id or email
    const empDoc = await Employee.findOne({
      $or: [
        ...(employeeId ? [{ _id: req.user._id }] : []),
        ...(employeeEmail ? [{ email: employeeEmail }] : [])
      ]
    });

    const nameParts = employeeName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'staff';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    const nameConditions = [
      { specialistName: new RegExp(firstName, 'i') },
      { specialistName: new RegExp(employeeName, 'i') },
      { specialistName: 'Any Available Specialist' },
      ...(lastName ? [{ specialistName: new RegExp(lastName, 'i') }] : []),
      ...(empDoc ? [
        { specialistName: new RegExp(empDoc.name, 'i') },
        { specialistId: empDoc._id.toString() },
        { employeeId: empDoc._id.toString() }
      ] : []),
      ...(employeeId ? [
        { specialistId: employeeId },
        { employeeId: employeeId }
      ] : [])
    ];

    const appointments = await Appointment.find({
      $or: nameConditions
    }).sort({ appointmentDate: -1, appointmentTime: -1 });

    return ApiResponse.success(res, appointments, 'Assigned appointments list retrieved');
  } catch (error) {
    next(error);
  }
};

// Update status of assigned appointment
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const employeeName = req.user.name;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { bookingId: id };
    const appointment = await Appointment.findOne(query);
    if (!appointment) throw ApiError.notFound('Appointment record not found');

    // Ownership check: must be assigned to this specialist
    const specFirstName = employeeName.split(' ')[0].toLowerCase();
    const appSpecName = appointment.specialistName.toLowerCase();
    if (!appSpecName.includes(specFirstName) && req.user.role !== 'admin') {
      throw ApiError.forbidden('You are not authorized to update this appointment.');
    }

    const oldStatus = appointment.status;
    const oldPayment = appointment.paymentStatus;

    if (status) appointment.status = status;
    if (paymentStatus) appointment.paymentStatus = paymentStatus;
    await appointment.save();

    // Side-effects on status changes
    if (appointment.status === 'Completed' && oldStatus !== 'Completed') {
      // Record transaction if unpaid initially and payment is now completed
      if (appointment.paymentStatus === 'Paid' && oldPayment !== 'Paid') {
        const existingTxn = await Transaction.findOne({
          $or: [
            { description: new RegExp(appointment.bookingId, 'i') },
            { appointmentId: appointment._id.toString() }
          ],
          type: 'Credited'
        });

        if (!existingTxn) {
          const serviceDoc = await Service.findOne({ name: new RegExp((appointment.service || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
          const txnAmount = Number(appointment.price || (serviceDoc ? (serviceDoc.discountPrice || serviceDoc.price) : 0));

          if (txnAmount > 0) {
            const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
            await Transaction.create({
              txnId,
              type: 'Credited',
              category: 'Appointment Booking',
              description: `Completed Booking Payment #${appointment.bookingId} (${appointment.customerName})`,
              amount: txnAmount,
              paymentMethod: appointment.paymentMethod || 'Cash',
              status: 'Completed',
              branchId: appointment.branchId,
              appointmentId: appointment._id.toString()
            });
          }
        }
      }

      await ActivityLog.create({
        action: 'Appointment Completed',
        details: `Specialist ${employeeName} marked Booking #${appointment.bookingId} as Completed.`,
        user: employeeName,
        branchId: appointment.branchId
      });
    }

    broadcastEvent('appointment:updated', { appointment });
    return ApiResponse.success(res, appointment, 'Appointment status updated successfully');
  } catch (error) {
    next(error);
  }
};

// Attendance clock-in
exports.clockInAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const employeeName = req.user.name;
    const todayStr = new Date().toISOString().split('T')[0];

    // Prevent duplicate clock-ins
    const existingLog = await Attendance.findOne({ employeeId, date: todayStr });
    if (existingLog) {
      throw ApiError.badRequest('You have already clocked in for today!');
    }

    const clockInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log = await Attendance.create({
      employee: req.user._id,
      employeeId,
      employeeName,
      date: todayStr,
      clockIn: clockInTime,
      clockOut: '06:00 PM',
      status: 'Present',
      branchId: req.user.branchId
    });

    await ActivityLog.create({
      action: 'Staff Clocked In',
      details: `${employeeName} clocked in for the shift at ${clockInTime}.`,
      user: employeeName,
      branchId: req.user.branchId
    });

    broadcastEvent('attendance:clock_in', { employeeName, time: clockInTime });
    return ApiResponse.created(res, log, `Successfully clocked in at ${clockInTime}`);
  } catch (error) {
    next(error);
  }
};

// Attendance clock-out
exports.clockOutAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const todayStr = new Date().toISOString().split('T')[0];

    const log = await Attendance.findOne({ employeeId, date: todayStr });
    if (!log) {
      throw ApiError.badRequest('No clock-in record found for today.');
    }

    const clockOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    log.clockOut = clockOutTime;
    await log.save();

    await ActivityLog.create({
      action: 'Staff Clocked Out',
      details: `${req.user.name} clocked out at ${clockOutTime}.`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    broadcastEvent('attendance:clock_out', { employeeName: req.user.name, time: clockOutTime });
    return ApiResponse.success(res, log, `Successfully clocked out at ${clockOutTime}`);
  } catch (error) {
    next(error);
  }
};

// Get personal attendance logs
exports.getEmployeeAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const list = await Attendance.find({ employeeId }).sort({ date: -1 });
    return ApiResponse.success(res, list, 'Personal attendance records retrieved');
  } catch (error) {
    next(error);
  }
};

// Submit leave request
exports.submitLeaveRequest = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const employeeName = req.user.name;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      throw ApiError.badRequest('Please provide start date, end date, and leave reason');
    }

    const request = await Leave.create({
      employee: req.user._id,
      employeeId,
      employeeName,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      branchId: req.user.branchId
    });

    // Send admin dashboard notification
    const notificationController = require('./notificationController');
    await notificationController.dispatchNotification(req.app, {
      role: 'admin',
      title: 'New Leave Request 📅',
      message: `Staff member ${employeeName} applied for leave from ${startDate} to ${endDate}. Reason: ${reason}`,
      type: 'leave',
      priority: 'high',
      link: '/admin?tab=leaves'
    });

    await ActivityLog.create({
      action: 'Leave Request Submitted',
      details: `${employeeName} applied for leave (${startDate} to ${endDate}).`,
      user: employeeName,
      branchId: req.user.branchId
    });

    broadcastEvent('leave:requested', request);
    return ApiResponse.created(res, request, 'Leave request submitted successfully');
  } catch (error) {
    next(error);
  }
};

// Get personal leave applications
exports.getEmployeeLeaves = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const list = await Leave.find({ employeeId }).sort({ createdAt: -1 });
    return ApiResponse.success(res, list, 'Personal leave applications retrieved');
  } catch (error) {
    next(error);
  }
};

// Get payroll slips
exports.getEmployeePayrolls = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const list = await Payroll.find({ employeeId }).sort({ createdAt: -1 });
    return ApiResponse.success(res, list, 'Personal salary slips retrieved');
  } catch (error) {
    next(error);
  }
};

// Update bank payout details
exports.updateBankDetails = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const { accountName, accountNumber, ifscCode, bankName, upiId } = req.body;

    if (!accountName || !accountNumber || !ifscCode || !bankName) {
      throw ApiError.badRequest('Please complete all fields for bank transfer payouts');
    }

    // Save bank details to both User and Employee profiles
    await User.findByIdAndUpdate(employeeId, {
      bankDetails: { accountName, accountNumber, ifscCode, bankName, upiId: upiId || '' }
    });

    await Employee.findByIdAndUpdate(employeeId, {
      bankDetails: { accountName, accountNumber, ifscCode, bankName, upiId: upiId || '' }
    });

    await ActivityLog.create({
      action: 'Bank Details Updated',
      details: `${req.user.name} updated bank details for payroll processing.`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    return ApiResponse.success(res, null, 'Bank details successfully updated for payroll payments');
  } catch (error) {
    next(error);
  }
};

// Add Walk-In appointment directly from employee dashboard
exports.createEmployeeWalkIn = async (req, res, next) => {
  try {
    const { customerName, customerPhone, service, specialistName, appointmentTime, paymentMethod, notes } = req.body;

    if (!customerName || !service) {
      throw ApiError.badRequest('Customer name and service are required');
    }

    const bookingId = `SPY-WI-${Math.floor(100000 + Math.random() * 900000)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const bookingDateTime = now.toISOString();
    const bookingTimeFormattedStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Resolve service price from Service model
    const serviceDoc = await Service.findOne({ name: new RegExp((service || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
    if (!serviceDoc) {
      return ApiResponse.badRequest(res, `Walk-in service '${service}' was not found in database.`);
    }

    const validatedPrice = Number(serviceDoc.discountPrice || serviceDoc.price || 0);

    const newApp = await Appointment.create({
      bookingId,
      customerName,
      customerPhone: customerPhone || '+91 98765 00000',
      customerEmail: '',
      service,
      price: validatedPrice,
      specialistName: specialistName || req.user.name,
      branch: 'Jubilee Hills Flagship',
      branchId: req.user.branchId,
      bookingDateTime,
      bookingDate: todayStr,
      bookingTimeFormatted: bookingTimeFormattedStr,
      appointmentDate: todayStr,
      appointmentTime: appointmentTime || 'Immediate Walk-In',
      paymentMethod: paymentMethod || 'Cash',
      paymentStatus: 'Paid',
      status: 'In Progress',
      notes: notes || 'Direct Walk-In Client added by Stylist Desk.',
      customerId: null
    });

    // Save transaction to Ledger
    await Transaction.create({
      txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'Credited',
      category: 'Appointment Booking',
      description: `Walk-In Booking Payment #${bookingId} (${customerName})`,
      amount: validatedPrice,
      paymentMethod: paymentMethod || 'Cash',
      status: 'Completed',
      branchId: req.user.branchId,
      appointmentId: newApp._id.toString()
    });

    await ActivityLog.create({
      action: 'Employee Walk-In Added',
      details: `Stylist ${req.user.name} recorded walk-in appointment ${bookingId} for ${customerName} (${service})`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    broadcastEvent('appointment:new', newApp);
    return ApiResponse.created(res, newApp, 'Walk-in appointment recorded successfully!');
  } catch (error) {
    next(error);
  }
};

// Retrieve employee dashboard calendar details
exports.getCalendarOverview = async (req, res, next) => {
  try {
    const employeeName = (req.user.name || '').trim();
    const employeeEmail = (req.user.email || '').toLowerCase().trim();
    const employeeId = req.user._id ? req.user._id.toString() : '';

    const empDoc = await Employee.findOne({
      $or: [
        ...(employeeId ? [{ _id: req.user._id }] : []),
        ...(employeeEmail ? [{ email: employeeEmail }] : [])
      ]
    });

    const nameParts = employeeName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'staff';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    const appointments = await Appointment.find({
      $or: [
        { specialistName: new RegExp(firstName, 'i') },
        { specialistName: new RegExp(employeeName, 'i') },
        { specialistName: 'Any Available Specialist' },
        ...(lastName ? [{ specialistName: new RegExp(lastName, 'i') }] : []),
        ...(empDoc ? [
          { specialistName: new RegExp(empDoc.name, 'i') },
          { specialistId: empDoc._id.toString() },
          { employeeId: empDoc._id.toString() }
        ] : []),
        ...(employeeId ? [
          { specialistId: employeeId },
          { employeeId: employeeId }
        ] : [])
      ]
    }).sort({ appointmentDate: -1 });

    const attendance = await Attendance.find({ employeeId }).sort({ date: -1 });
    const leaves = await Leave.find({ employeeId }).sort({ startDate: -1 });
    const payrolls = await Payroll.find({ employeeId }).sort({ createdAt: -1 });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
    const leavesCount = leaves.filter(l => l.status === 'Approved').length;

    return ApiResponse.success(res, {
      appointments,
      attendance,
      leaves,
      payrolls,
      summary: {
        totalAppointments,
        completedAppointments,
        leavesCount
      }
    }, 'Employee calendar overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};
