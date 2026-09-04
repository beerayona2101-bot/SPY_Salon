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
const Service = require('../models/Service');
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
    const { status, paymentStatus, rejectionReason } = req.body;
    const employeeName = req.user.name || 'Specialist';

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { bookingId: id };
    const appointment = await Appointment.findOne(query);
    if (!appointment) throw ApiError.notFound('Appointment record not found');

    // Ownership check: must be assigned to this specialist or admin
    const specFirstName = employeeName.split(' ')[0].toLowerCase();
    const appSpecName = (appointment.specialistName || '').toLowerCase();
    if (!appSpecName.includes(specFirstName) && req.user.role !== 'admin' && !appSpecName.includes('any available specialist')) {
      throw ApiError.forbidden('You are not authorized to update this appointment.');
    }

    const isRejection = status === 'Staff_Rejected' || status === 'Rejected' || Boolean(rejectionReason);
    let targetStatus = status || appointment.status;
    let targetSpecialistName = appointment.specialistName;

    if (isRejection) {
      targetStatus = 'Pending'; // Reassign to open Pending status for any available staff
      targetSpecialistName = 'Any Available Specialist';
      appointment.rejectedAt = new Date();
      appointment.rejectionReason = rejectionReason || `Unavailable (${employeeName})`;
      await appointment.save();
    }

    const adminService = require('../services/adminService');
    const updated = await adminService.updateAppointmentStatus(
      appointment._id.toString(),
      targetStatus,
      paymentStatus || appointment.paymentStatus,
      { 
        name: req.user.name || 'Specialist', 
        role: req.user.role || 'employee',
        specialistName: targetSpecialistName,
        note: isRejection ? `Declined by ${employeeName} and reassigned to Any Available Specialist. Reason: ${rejectionReason || 'Staff unavailable'}` : undefined
      }
    );

    if (isRejection) {
      // Broadcast notification to ALL Employees & Admins so everyone sees the reassigned appointment
      try {
        const notificationController = require('./notificationController');
        await notificationController.dispatchNotification(req.app, {
          role: 'employee',
          title: 'Appointment Reassigned 📢',
          message: `Specialist ${employeeName} was unavailable for appointment #${appointment.bookingId} (${appointment.service}). It is now open to all available specialists.`,
          type: 'appointment',
          priority: 'high',
          bookingId: appointment.bookingId,
          appointmentId: appointment._id.toString(),
          link: '/employee?tab=queue'
        });

        await notificationController.dispatchNotification(req.app, {
          role: 'admin',
          title: 'Specialist Declined Booking ⚠️',
          message: `Specialist ${employeeName} declined booking #${appointment.bookingId} (${appointment.service}). Appointment reassigned to Any Available Specialist.`,
          type: 'appointment',
          priority: 'high',
          bookingId: appointment.bookingId,
          appointmentId: appointment._id.toString()
        });

        broadcastEvent('appointment:new', { appointment: updated });
        broadcastEvent('appointment:updated', { appointment: updated });
      } catch (notifErr) {
        console.error('[EmployeeController] Rejection notification dispatch error:', notifErr);
      }
    }

    return ApiResponse.success(res, updated, isRejection ? 'Appointment declined and reassigned to all available staff.' : 'Appointment status updated successfully');
  } catch (error) {
    next(error);
  }
};



// Asia/Kolkata Timezone Helpers for Attendance
const getKolkataDateStr = (dateObj = new Date()) => {
  return dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
};

const getKolkataTimeStr = (dateObj = new Date()) => {
  return dateObj.toLocaleTimeString('en-US', { 
    timeZone: 'Asia/Kolkata', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }); // e.g. "10:46 AM"
};

// Attendance clock-in
exports.clockInAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const { autoCheckoutPastUnclosedShifts } = require('../utils/attendanceCalculator');
    await autoCheckoutPastUnclosedShifts(employeeId);

    const employeeName = req.user.name;
    const todayStr = getKolkataDateStr();

    // Prevent clock-in on approved leave dates
    const approvedLeave = await Leave.findOne({
      $or: [{ employeeId: req.user._id }, { employee: req.user._id }],
      status: 'Approved',
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr }
    });

    if (approvedLeave) {
      throw ApiError.badRequest(`Attendance Blocked: You are on approved leave today (${approvedLeave.startDate} to ${approvedLeave.endDate}). Clock-in is restricted during leave.`);
    }

    // Prevent duplicate clock-ins and validate existing state
    const existingLog = await Attendance.findOne({ employeeId, date: todayStr });
    if (existingLog) {
      if (existingLog.attendanceState === 'CLOCKED_IN') {
        throw ApiError.badRequest('You are already clocked in.');
      } else if (existingLog.attendanceState === 'ON_BREAK') {
        throw ApiError.badRequest('Please end your break before continuing.');
      } else if (existingLog.attendanceState === 'CLOCKED_OUT') {
        throw ApiError.badRequest("Today's shift has already been completed.");
      }
      throw ApiError.badRequest('You have already clocked in for today!');
    }

    const now = new Date();
    const clockInTime = getKolkataTimeStr(now);

    const log = await Attendance.create({
      employee: req.user._id,
      employeeId,
      employeeName,
      date: todayStr,
      clockIn: clockInTime,
      clockOut: null, // MUST BE NULL while employee is working!
      clockInTimestamp: now,
      clockOutTimestamp: null,
      status: 'Present',
      attendanceState: 'CLOCKED_IN',
      breaks: [],
      totalBreakDuration: 0,
      totalShiftDuration: 0,
      effectiveWorkingDuration: 0,
      branchId: req.user.branchId
    });

    await ActivityLog.create({
      action: 'Staff Clocked In',
      details: `${employeeName} clocked in for shift at ${clockInTime}.`,
      user: employeeName,
      branchId: req.user.branchId
    });

    broadcastEvent('attendance:clock_in', { employeeName, time: clockInTime, attendanceState: 'CLOCKED_IN' });
    return ApiResponse.created(res, log, `Successfully clocked in at ${clockInTime}`);
  } catch (error) {
    next(error);
  }
};

// Start Break
exports.startBreakAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const todayStr = getKolkataDateStr();

    const log = await Attendance.findOne({ employeeId, date: todayStr });
    if (!log) {
      throw ApiError.badRequest('No clock-in record found for today. Please clock in first.');
    }

    if (log.attendanceState === 'ON_BREAK') {
      throw ApiError.badRequest('You are already on break.');
    }
    if (log.attendanceState === 'CLOCKED_OUT') {
      throw ApiError.badRequest("Today's shift has already been completed.");
    }
    if (log.attendanceState !== 'CLOCKED_IN') {
      throw ApiError.badRequest('Invalid attendance state for starting a break.');
    }

    // Ensure only one active break exists
    const activeBreak = log.breaks.find(b => !b.end || !b.endTimestamp);
    if (activeBreak) {
      throw ApiError.badRequest('You already have an active break in progress.');
    }

    const now = new Date();
    const breakStartTime = getKolkataTimeStr(now);

    log.breaks.push({
      start: breakStartTime,
      end: null,
      startTimestamp: now,
      endTimestamp: null,
      duration: 0
    });
    log.attendanceState = 'ON_BREAK';
    await log.save();

    await ActivityLog.create({
      action: 'Staff Started Break',
      details: `${req.user.name} started break at ${breakStartTime}.`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    broadcastEvent('attendance:start_break', { employeeName: req.user.name, time: breakStartTime, attendanceState: 'ON_BREAK' });
    return ApiResponse.success(res, log, `Break started at ${breakStartTime}`);
  } catch (error) {
    next(error);
  }
};

// End Break
exports.endBreakAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const todayStr = getKolkataDateStr();

    const log = await Attendance.findOne({ employeeId, date: todayStr });
    if (!log) {
      throw ApiError.badRequest('No clock-in record found for today.');
    }

    if (log.attendanceState !== 'ON_BREAK') {
      throw ApiError.badRequest('No active break found to end.');
    }

    // Find the active break
    const activeBreak = log.breaks.find(b => !b.end || !b.endTimestamp);
    if (!activeBreak) {
      throw ApiError.badRequest('No active break found.');
    }

    const now = new Date();
    const breakEndTime = getKolkataTimeStr(now);

    activeBreak.end = breakEndTime;
    activeBreak.endTimestamp = now;

    // Calculate break duration in minutes
    const startMs = activeBreak.startTimestamp ? new Date(activeBreak.startTimestamp).getTime() : now.getTime();
    const durationMinutes = Math.max(1, Math.round((now.getTime() - startMs) / 60000));
    activeBreak.duration = durationMinutes;

    // Sum all completed break durations
    log.totalBreakDuration = log.breaks.reduce((acc, b) => acc + (Number(b.duration) || 0), 0);
    log.attendanceState = 'CLOCKED_IN';
    await log.save();

    await ActivityLog.create({
      action: 'Staff Ended Break',
      details: `${req.user.name} ended break at ${breakEndTime} (Duration: ${durationMinutes} mins).`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    broadcastEvent('attendance:end_break', { employeeName: req.user.name, time: breakEndTime, attendanceState: 'CLOCKED_IN' });
    return ApiResponse.success(res, log, `Break ended at ${breakEndTime} (${durationMinutes} mins)`);
  } catch (error) {
    next(error);
  }
};

// Attendance clock-out
exports.clockOutAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const todayStr = getKolkataDateStr();

    const log = await Attendance.findOne({ employeeId, date: todayStr });
    if (!log) {
      throw ApiError.badRequest('No clock-in record found for today.');
    }

    if (log.attendanceState === 'ON_BREAK') {
      throw ApiError.badRequest('Please end your break before clocking out.');
    }
    if (log.attendanceState === 'CLOCKED_OUT') {
      throw ApiError.badRequest("Today's shift has already been completed.");
    }

    const now = new Date();
    const clockOutTime = getKolkataTimeStr(now);

    log.clockOut = clockOutTime;
    log.clockOutTimestamp = now;

    // Calculate shift durations
    const clockInMs = log.clockInTimestamp ? new Date(log.clockInTimestamp).getTime() : now.getTime();
    const totalShiftMins = Math.max(0, Math.round((now.getTime() - clockInMs) / 60000));
    const totalBreakMins = log.breaks.reduce((acc, b) => acc + (Number(b.duration) || 0), 0);

    const effectiveMins = Math.max(0, totalShiftMins - totalBreakMins);
    log.totalShiftDuration = totalShiftMins;
    log.totalBreakDuration = totalBreakMins;
    log.effectiveWorkingDuration = effectiveMins;
    log.attendanceState = 'CLOCKED_OUT';

    // Enforce 7-hour threshold (420 mins) classification
    const { classifyAttendanceType, aggregateMonthlyAttendance } = require('../utils/attendanceCalculator');
    log.attendanceType = classifyAttendanceType(effectiveMins);
    log.status = log.attendanceType === 'FULL_DAY' ? 'Present' : 'Half Day';

    await log.save();

    await ActivityLog.create({
      action: 'Staff Clocked Out',
      details: `${req.user.name} clocked out at ${clockOutTime}. Effective work: ${effectiveMins} mins (${log.attendanceType}).`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    broadcastEvent('attendance:clock_out', { employeeName: req.user.name, time: clockOutTime, attendanceState: 'CLOCKED_OUT', attendanceType: log.attendanceType });
    return ApiResponse.success(res, log, `Successfully clocked out at ${clockOutTime} (${log.attendanceType})`);
  } catch (error) {
    next(error);
  }
};

// Get monthly attendance aggregated summary
exports.getMonthlyAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const { month } = req.query;
    const { aggregateMonthlyAttendance } = require('../utils/attendanceCalculator');
    const data = await aggregateMonthlyAttendance(employeeId, month);
    return ApiResponse.success(res, data, 'Monthly attendance aggregated successfully');
  } catch (error) {
    next(error);
  }
};

// Get today's attendance record
exports.getTodayAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const { autoCheckoutPastUnclosedShifts } = require('../utils/attendanceCalculator');
    await autoCheckoutPastUnclosedShifts(employeeId);

    const todayStr = getKolkataDateStr();
    const log = await Attendance.findOne({ employeeId, date: todayStr });

    const approvedLeave = await Leave.findOne({
      $or: [{ employeeId: req.user._id }, { employee: req.user._id }],
      status: 'Approved',
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr }
    });

    if (approvedLeave) {
      const responseData = log ? (log.toObject ? log.toObject() : { ...log }) : {};
      responseData.isOnApprovedLeave = true;
      responseData.approvedLeaveDetails = approvedLeave;
      responseData.attendanceState = log ? log.attendanceState : 'ON_LEAVE';
      return ApiResponse.success(res, responseData, 'Staff is on approved leave today.');
    }

    return ApiResponse.success(res, log || null, 'Today attendance state retrieved');
  } catch (error) {
    next(error);
  }
};

// Get personal attendance logs
exports.getEmployeeAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user._id.toString();
    const { autoCheckoutPastUnclosedShifts } = require('../utils/attendanceCalculator');
    await autoCheckoutPastUnclosedShifts(employeeId);

    const list = await Attendance.find({
      $or: [{ employeeId }, { employee: req.user._id }]
    }).sort({ date: -1 });
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

    if (!startDate || !endDate || !reason || !String(reason).trim()) {
      throw ApiError.badRequest('Please provide start date, end date, and leave reason.');
    }

    if (startDate > endDate) {
      throw ApiError.badRequest('Start date cannot be after end date.');
    }

    const { getKolkataCurrentDateStr } = require('../utils/timezoneHelper');
    const todayStr = getKolkataCurrentDateStr();
    if (startDate < todayStr) {
      throw ApiError.badRequest(`Leave start date (${startDate}) cannot be in the past. Current date is ${todayStr}.`);
    }

    const request = await Leave.create({
      employee: req.user._id,
      employeeId,
      employeeName,
      employeeEmail: req.user.email || null,
      employeePhone: req.user.phone || null,
      startDate,
      endDate,
      reason: String(reason).trim(),
      status: 'Pending',
      branchId: req.user.branchId
    });

    // Send admin dashboard notification
    const notificationController = require('./notificationController');
    await notificationController.dispatchNotification(req.app, {
      role: 'admin',
      title: `New Leave Request from ${employeeName}`,
      message: `${employeeName} requested leave from ${startDate} to ${endDate}. Reason: ${reason}`,
      type: 'leave',
      priority: 'high',
      leaveRequestId: request._id.toString(),
      link: `/admin?leaveId=${request._id}`
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
    const list = await Leave.find({
      $or: [{ employeeId }, { employee: req.user._id }]
    }).sort({ createdAt: -1 });
    return ApiResponse.success(res, list, 'Personal leave applications retrieved');
  } catch (error) {
    next(error);
  }
};

// Get single leave application by ID
exports.getLeaveById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) throw ApiError.notFound('Leave request not found');

    const empId = req.user._id.toString();
    if (req.user.role !== 'admin' && String(leave.employeeId) !== empId && String(leave.employee) !== empId) {
      throw ApiError.forbidden('Unauthorized access to leave request details.');
    }

    return ApiResponse.success(res, leave, 'Leave request retrieved successfully');
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
    const employeeEmail = (req.user.email || '').toLowerCase().trim();
    const { accountName, accountNumber, ifscCode, bankName, upiId } = req.body;

    if (!accountName || !accountNumber || !ifscCode || !bankName) {
      throw ApiError.badRequest('Please complete all required fields for bank transfer payouts');
    }

    const bankDetailsObj = {
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      bankName: bankName.trim(),
      upiId: (upiId || '').trim()
    };

    // Save bank details to both User and Employee profiles
    await User.findByIdAndUpdate(employeeId, { bankDetails: bankDetailsObj });

    await Employee.findOneAndUpdate(
      { $or: [{ _id: req.user._id }, { email: employeeEmail }] },
      { bankDetails: bankDetailsObj },
      { new: true }
    );

    await ActivityLog.create({
      action: 'Bank Details Updated',
      details: `${req.user.name} updated bank details for payroll processing.`,
      user: req.user.name,
      branchId: req.user.branchId
    });

    return ApiResponse.success(res, bankDetailsObj, 'Bank details successfully updated for payroll payments');
  } catch (error) {
    next(error);
  }
};

// Staff Member Manual Customer Entry
exports.createCustomerByStaff = async (req, res, next) => {
  try {
    const { name, phone, email, gender, address } = req.body;

    if (!name || !name.trim()) {
      throw ApiError.badRequest('Customer full name is required');
    }
    if (!phone || !phone.trim()) {
      throw ApiError.badRequest('Customer phone number is required');
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      throw ApiError.badRequest('Please enter a valid phone number (minimum 7 digits)');
    }

    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : `${cleanPhone}@spysalon.local`;

    // Check duplicate customer by phone or email
    let existingUser = await User.findOne({
      $or: [{ phone: cleanPhone }, { email: cleanEmail }]
    });

    if (existingUser) {
      return ApiResponse.success(res, existingUser, 'Customer profile already exists in system database.');
    }

    const tempPassword = `Spy@${cleanPhone.slice(-4)}`;
    const newCustomer = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: tempPassword,
      role: 'customer',
      gender: gender || '',
      address: address || '',
      isVerified: true
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('customer:created', newCustomer);
    }

    return ApiResponse.created(res, newCustomer, 'Customer account created successfully.');
  } catch (error) {
    next(error);
  }
};

exports.getCustomersForStaff = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    return ApiResponse.success(res, customers, 'Customer directory retrieved');
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

    // Resolve service price from Service model safely
    let validatedPrice = 999;
    try {
      const serviceDoc = await Service.findOne({ name: new RegExp((service || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      if (serviceDoc) {
        validatedPrice = Number(serviceDoc.discountPrice || serviceDoc.price || 999);
      }
    } catch (sErr) {}

    const newApp = await Appointment.create({
      bookingId,
      customerName,
      customerPhone: customerPhone || '+91 98765 00000',
      customerEmail: '',
      service,
      price: validatedPrice,
      specialistName: specialistName || req.user.name,
      specialistId: req.user._id ? req.user._id.toString() : null,
      employeeId: req.user._id ? req.user._id.toString() : null,
      employee: req.user._id || null,
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
    broadcastEvent('appointment:created', newApp);
    broadcastEvent('appointment:updated', newApp);
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
