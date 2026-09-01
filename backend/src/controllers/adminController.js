/**
 * Production-Level Admin Controller for SPY Salon Enterprise REST API
 * Consumes AdminService and returns standardized ApiResponse objects.
 */
const mongoose = require('mongoose');
const adminService = require('../services/adminService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const MembershipPlan = require('../models/MembershipPlan');
const Appointment = require('../models/Appointment');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Review = require('../models/Review');
const Payroll = require('../models/Payroll');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Enquiry = require('../models/Enquiry');
const LandingSettings = require('../models/LandingSettings');
const { sendEnquiryResolutionEmail } = require('../services/emailService');
const { broadcastEvent } = require('../utils/socket');

exports.getAdminLandingSettings = async (req, res, next) => {
  try {
    let settings = await LandingSettings.findOne({ key: 'main_landing_settings' });
    if (!settings) {
      settings = await LandingSettings.create({ 
        key: 'main_landing_settings',
        heroTitle: 'Hairs make perfectly',
        heroSubtitle: 'Style come from the hair style'
      });
    } else {
      let updated = false;
      if (settings.heroTitle === 'SPY Salon | Luxury Beauty Studio & MedSpa' || settings.heroTitle === 'Unveil Your Radiant Beauty' || settings.heroTitle === 'Hairs make perfect') {
        settings.heroTitle = 'Hairs make perfectly';
        updated = true;
      }
      if (!settings.heroSubtitle) {
        settings.heroSubtitle = 'Style come from the hair style';
        updated = true;
      }
      if (updated) {
        await settings.save();
      }
    }
    return ApiResponse.success(res, settings, 'Landing settings retrieved');
  } catch (error) {
    next(error);
  }
};

exports.updateLandingSettings = async (req, res, next) => {
  try {
    let settings = await LandingSettings.findOneAndUpdate(
      { key: 'main_landing_settings' },
      { $set: req.body },
      { new: true, upsert: true }
    );

    // Broadcast Socket.IO real-time event to all connected clients & browsers
    const io = req.app.get('io');
    if (io) {
      io.emit('landing_settings_updated', settings);
    }
    broadcastEvent('landing_settings_updated', settings);

    return ApiResponse.success(res, settings, 'Home Page & Website Settings saved successfully');
  } catch (error) {
    next(error);
  }
};

// Helper to filter query parameters by branch depending on user role
const applyBranchFilter = (req, queryObj = {}) => {
  const filter = { ...queryObj };
  if (req.user.role !== 'admin') {
    filter.branchId = req.user.branchId;
  }
  return filter;
};

// ================= ANALYTICS & REPORTS =================
exports.getAnalytics = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
    const summary = await adminService.getAnalyticsSummary(branchId);
    return ApiResponse.success(res, summary, 'Analytics summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const filter = applyBranchFilter(req, req.query);
    const result = await adminService.getActivityLogs(filter);
    return ApiResponse.paginated(res, result.data, 1, result.data.length, result.total, 'Activity logs retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createActivityLog = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const { action, details, user } = req.body;
    const logItem = await adminService.createActivityLog({ action, details, user, branchId });
    return ApiResponse.created(res, logItem, 'Activity log created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
    const notifications = await adminService.getNotifications(branchId);
    return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    const branchId = req.user.role === 'admin' ? null : req.user.branchId;
    
    const query = { recipientRole: 'admin' };
    if (notificationId) query._id = notificationId;
    if (branchId) query.branchId = branchId;

    await Notification.updateMany(query, { read: true, readAt: new Date().toISOString() });

    broadcastEvent('notification:admin_read', { notificationId });
    return ApiResponse.success(res, null, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
};

exports.getAiPowerBiReport = async (req, res, next) => {
  try {
    const report = await adminService.getAiPowerBiReport();
    return ApiResponse.success(res, report, 'Executive report dataset generated');
  } catch (error) {
    next(error);
  }
};

// ================= EMPLOYEE MANAGEMENT =================
exports.getEmployees = async (req, res, next) => {
  try {
    const filter = applyBranchFilter(req, req.query);
    const result = await adminService.getEmployees(filter);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Employees list retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await adminService.getEmployeeById(req.params.id);
    if (req.user.role !== 'admin' && String(employee.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to this employee profile.');
    }
    return ApiResponse.success(res, employee, 'Employee profile retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const result = await adminService.createEmployee({ ...req.body, branchId });
    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Employee registered successfully',
      data: result.data,
      credentials: result.credentials
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) throw ApiError.notFound('Employee profile not found');
    if (req.user.role !== 'admin' && String(emp.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized update attempt.');
    }

    const updated = await adminService.updateEmployee(req.params.id, req.body);
    return ApiResponse.success(res, updated, 'Employee profile updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) throw ApiError.notFound('Employee profile not found');
    if (req.user.role !== 'admin' && String(emp.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized deletion attempt.');
    }

    await adminService.deleteEmployee(req.params.id);
    return ApiResponse.success(res, null, 'Employee record deleted');
  } catch (error) {
    next(error);
  }
};

// ================= CUSTOMERS MANAGEMENT =================
exports.getCustomers = async (req, res, next) => {
  try {
    const result = await adminService.getCustomers(req.query);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Customer directory retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const created = await adminService.createCustomer(req.body);
    return ApiResponse.created(res, created, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const updated = await adminService.updateCustomer(req.params.id, req.body);
    return ApiResponse.success(res, updated, 'Customer account updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    await adminService.deleteCustomer(req.params.id);
    return ApiResponse.success(res, null, 'Customer account deleted');
  } catch (error) {
    next(error);
  }
};

// ================= SERVICES PRICING MENU =================
exports.getAdminServices = async (req, res, next) => {
  try {
    const filter = applyBranchFilter(req, req.query);
    const result = await adminService.getServices(filter);
    return ApiResponse.success(res, result.data, 'Services menu retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const created = await adminService.createService({ ...req.body, branchId });
    return ApiResponse.created(res, created, 'New service added to pricing menu');
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw ApiError.notFound('Service not found');
    if (req.user.role !== 'admin' && String(service.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to this service.');
    }

    const updated = await adminService.updateService(req.params.id, req.body);
    return ApiResponse.success(res, updated, 'Service item updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) throw ApiError.notFound('Service not found');
    if (req.user.role !== 'admin' && String(service.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to this service.');
    }

    await adminService.deleteService(req.params.id);
    return ApiResponse.success(res, null, 'Service item removed from menu');
  } catch (error) {
    next(error);
  }
};

// ================= MEMBERSHIP PLANS CRUD =================
exports.getAdminMemberships = async (req, res, next) => {
  try {
    const result = await adminService.getMemberships();
    return ApiResponse.success(res, result.data, 'Membership packages retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createMembership = async (req, res, next) => {
  try {
    const created = await adminService.createMembership(req.body);
    return ApiResponse.created(res, created, 'New membership package created');
  } catch (error) {
    next(error);
  }
};

exports.updateMembership = async (req, res, next) => {
  try {
    const updated = await adminService.updateMembership(req.params.id, req.body);
    return ApiResponse.success(res, updated, 'Membership package updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteMembership = async (req, res, next) => {
  try {
    await adminService.deleteMembership(req.params.id);
    return ApiResponse.success(res, null, 'Membership package removed');
  } catch (error) {
    next(error);
  }
};

// ================= APPOINTMENTS DESK =================
exports.getAdminAppointments = async (req, res, next) => {
  try {
    const filter = applyBranchFilter(req, req.query);
    const result = await adminService.getAppointments(filter);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Appointments list retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createAdminAppointment = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const created = await adminService.createAppointment({ ...req.body, branchId });
    return ApiResponse.created(res, created, 'Appointment booked successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const app = await Appointment.findById(req.params.id);
    if (!app) throw ApiError.notFound('Appointment not found');
    if (req.user.role !== 'admin' && String(app.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to this appointment.');
    }

    const updated = await adminService.updateAppointmentStatus(req.params.id, req.body.status || 'Confirmed');
    return ApiResponse.success(res, updated, 'Appointment status updated');
  } catch (error) {
    next(error);
  }
};

exports.respondReschedule = async (req, res, next) => {
  try {
    const app = await Appointment.findById(req.params.id);
    if (!app) throw ApiError.notFound('Appointment not found');
    if (req.user.role !== 'admin' && String(app.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to this appointment.');
    }

    const { action, rejectionReason } = req.body;
    const updated = await adminService.respondReschedule(req.params.id, action || 'Approve', rejectionReason);
    return ApiResponse.success(res, updated, `Reschedule request ${action === 'Reject' ? 'rejected' : 'approved'}`);
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const app = await Appointment.findById(req.params.id);
    if (!app) throw ApiError.notFound('Appointment not found');
    if (req.user.role !== 'admin' && String(app.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to this appointment.');
    }

    await adminService.deleteAppointment(req.params.id);
    return ApiResponse.success(res, null, 'Appointment cancelled and removed');
  } catch (error) {
    next(error);
  }
};

// ================= LEAVES & ATTENDANCE =================
exports.getLeaves = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
    const filter = branchId ? { branchId } : {};
    const leaves = await Leave.find(filter).sort({ createdAt: -1 });
    return ApiResponse.success(res, leaves, 'Leave applications retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createLeave = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const newLeave = await Leave.create({
      employeeName: req.body.employeeName || 'Staff Member',
      employee: req.body.employeeId || null,
      startDate: req.body.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate || new Date().toISOString().split('T')[0],
      reason: req.body.reason || 'Personal leave request',
      status: 'Pending',
      branchId
    });
    return ApiResponse.created(res, newLeave, 'Leave application submitted');
  } catch (error) {
    next(error);
  }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) throw ApiError.notFound('Leave request not found');

    if (req.user.role !== 'admin' && String(leave.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized action for this leave request.');
    }

    const oldStatus = leave.status;
    leave.status = req.body.status || 'Approved';
    await leave.save();

    // 1. Dispatch Notification directly to the Staff Member
    try {
      const notificationController = require('./notificationController');
      const isApproved = leave.status === 'Approved';
      const statusEmoji = isApproved ? '✅' : '❌';
      
      await notificationController.dispatchNotification(req.app, {
        userId: leave.employeeId ? String(leave.employeeId) : null,
        role: 'employee',
        title: `Leave Request ${leave.status}! ${statusEmoji}`,
        message: `Dear ${leave.employeeName}, your leave request from ${leave.startDate} to ${leave.endDate} has been ${leave.status.toUpperCase()} by Management.`,
        type: 'leave',
        priority: 'high',
        link: '/employee?tab=calendar'
      });
    } catch (staffNotifErr) {
      console.error('[AdminController] Staff leave notification error:', staffNotifErr);
    }

    // 2. Trigger Side-effects on Approval
    if (leave.status === 'Approved' && oldStatus !== 'Approved') {
      // Find and handle affected appointments of this specialist
      const affectedAppointments = await Appointment.find({
        specialistName: new RegExp(leave.employeeName.split(' ')[0], 'i'),
        appointmentDate: { $gte: leave.startDate, $lte: leave.endDate },
        status: { $nin: ['Cancelled'] }
      });

      for (const app of affectedAppointments) {
        app.status = 'Reschedule Requested';
        app.rescheduleRequested = true;
        app.rescheduleData = {
          requestedDate: app.appointmentDate,
          requestedTime: app.appointmentTime,
          reason: `Specialist ${leave.employeeName} approved leave on these dates.`,
          requestedAt: new Date().toISOString()
        };
        await app.save();

        // Customer in-app alert
        const notificationController = require('./notificationController');
        await notificationController.dispatchNotification(req.app, {
          userId: app.customerId ? String(app.customerId) : null,
          role: 'user',
          title: 'Reschedule Needed 📅',
          message: `Your booking #${app.bookingId} for ${app.service} needs rescheduling as specialist is on leave.`,
          type: 'appointment',
          priority: 'high',
          bookingId: app.bookingId
        }).catch(() => {});
      }

      await adminService.createActivityLog({
        action: 'Leave Approved',
        details: `Approved leave request for ${leave.employeeName}. ${affectedAppointments.length} appointments marked for reschedule.`,
        user: req.user.name,
        branchId: leave.branchId
      });
    }

    // Broadcast Realtime Socket Event
    broadcastEvent('leave:updated', { leave });
    if (leave.status === 'Approved') {
      broadcastEvent('leave:approved', { leave });
    }

    return ApiResponse.success(res, leave, `Leave request ${leave.status.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
};

exports.deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) throw ApiError.notFound('Leave request not found');

    if (req.user.role !== 'admin' && String(leave.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized deletion.');
    }

    await Leave.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Leave record deleted');
  } catch (error) {
    next(error);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
    const filter = branchId ? { branchId } : {};
    const attendance = await Attendance.find(filter).sort({ date: -1 });
    return ApiResponse.success(res, attendance, 'Attendance records retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
    const filter = branchId ? { branchId } : {};
    
    const employees = await Employee.find(filter).sort({ createdAt: 1 });
    const salonOpenedDays = 26;
    
    const report = await Promise.all(employees.map(async (emp, index) => {
      const empIdStr = emp._id.toString();
      const workedCount = await Attendance.countDocuments({
        $or: [{ employeeId: empIdStr }, { employee: emp._id }],
        status: { $in: ['Present', 'Late', 'Half Day'] }
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const todayLog = await Attendance.findOne({
        $or: [{ employeeId: empIdStr }, { employee: emp._id }],
        date: todayStr
      });

      const workedDays = workedCount;
      const absentDays = Math.max(0, salonOpenedDays - workedDays);
      const otLogs = await Attendance.find({
        $or: [{ employeeId: empIdStr }, { employee: emp._id }],
        otHours: { $gt: 0 }
      });
      const otHours = otLogs.reduce((sum, log) => sum + (log.otHours || 0), 0);
      const otTimes = otLogs.length;

      return {
        employeeId: emp._id,
        empCode: emp.empCode || `EMP-${1000 + index + 1}`,
        name: emp.name,
        avatar: emp.avatar,
        specialties: emp.specialties,
        salonOpenedDays,
        workedDays,
        absentDays,
        otHours,
        otTimes,
        attendancePercentage: salonOpenedDays > 0 ? (((workedDays) / salonOpenedDays) * 100).toFixed(1) + '%' : '0.0%',
        lastStatus: todayLog ? `${todayLog.status} (${todayLog.clockIn})` : 'Not Checked In'
      };
    }));

    return ApiResponse.success(res, report, 'Employee attendance report cards generated');
  } catch (error) {
    next(error);
  }
};

exports.recordAttendance = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const newLog = await Attendance.create({
      date: new Date().toISOString().split('T')[0],
      clockIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clockOut: '19:00',
      status: 'Present',
      employeeName: req.body.employeeName || 'Staff Member',
      employeeId: req.body.employeeId || null,
      branchId
    });
    return ApiResponse.created(res, newLog, 'Clock-in recorded');
  } catch (error) {
    next(error);
  }
};

// ================= REVIEWS MODERATION =================
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    return ApiResponse.success(res, reviews, 'Reviews retrieved');
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Review comment removed');
  } catch (error) {
    next(error);
  }
};

// ================= PAYROLLS & SALARY SLIPS =================
exports.getPayrolls = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
    const filter = branchId ? { branchId } : {};
    const slips = await Payroll.find(filter).sort({ createdAt: -1 });
    return ApiResponse.success(res, slips, 'Payroll slips retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createPayroll = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const base = Number(req.body.baseSalary || 0);
    const inc = Number(req.body.incentives || 0);
    const ded = Number(req.body.deductions || 0);
    const net = base + inc - ded;

    let empId = req.body.employeeId;
    let empCode = req.body.empCode;
    let empName = req.body.employeeName;

    if ((!empId || !empCode) && empName) {
      const empDoc = await Employee.findOne({ name: new RegExp(`^${empName.trim()}$`, 'i') });
      if (empDoc) {
        empId = empId || empDoc._id.toString();
        empCode = empCode || empDoc.empCode || `EMP-1001`;
        empName = empDoc.name;
      }
    }

    const slip = await Payroll.create({
      slipId: `PAY-2026-07-${Math.floor(100 + Math.random() * 900)}`,
      employeeName: empName || 'Staff Specialist',
      employeeId: empId || 'emp1',
      empCode: empCode || 'EMP-1001',
      month: req.body.month || 'July 2026',
      baseSalary: base,
      incentives: inc,
      deductions: ded,
      netPay: net,
      paymentMethod: req.body.paymentMethod || 'Bank Transfer (HDFC)',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Paid',
      branchId
    });

    // Debit transaction in ledger
    await Transaction.create({
      txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'Debited',
      category: 'Staff Payroll Disbursal',
      description: `Monthly Salary Disbursal - ${slip.employeeName} (${slip.empCode})`,
      amount: net,
      paymentMethod: slip.paymentMethod,
      status: 'Settled',
      date: new Date().toISOString(),
      branchId
    });

    await adminService.createActivityLog({
      action: 'Payroll Slip Issued',
      details: `Disbursed salary of ₹${net} to ${slip.employeeName}.`,
      user: req.user.name,
      branchId
    });

    return ApiResponse.created(res, slip, 'Salary slip generated and payroll transaction logged');
  } catch (error) {
    next(error);
  }
};

exports.updatePayrollStatus = async (req, res, next) => {
  try {
    const slip = await Payroll.findById(req.params.id);
    if (!slip) throw ApiError.notFound('Salary slip not found');

    if (req.user.role !== 'admin' && String(slip.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access to payroll record.');
    }

    slip.status = req.body.status || 'Paid';
    await slip.save();

    return ApiResponse.success(res, slip, `Payroll slip status updated to ${slip.status}`);
  } catch (error) {
    next(error);
  }
};

exports.deletePayroll = async (req, res, next) => {
  try {
    const slip = await Payroll.findById(req.params.id);
    if (!slip) throw ApiError.notFound('Salary slip not found');

    if (req.user.role !== 'admin' && String(slip.branchId) !== String(req.user.branchId)) {
      throw ApiError.forbidden('Unauthorized access.');
    }

    await Payroll.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Salary slip record deleted');
  } catch (error) {
    next(error);
  }
};

// ================= TRANSACTIONS LEDGER =================
exports.getTransactions = async (req, res, next) => {
  try {
    const filter = applyBranchFilter(req, req.query);
    const result = await adminService.getTransactions(filter);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Transactions ledger retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const branchId = req.user.role === 'admin' ? req.body.branchId : req.user.branchId;
    const created = await adminService.createTransaction({ ...req.body, branchId });
    return ApiResponse.created(res, created, 'Transaction entry logged successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    await adminService.deleteTransaction(req.params.id);
    return ApiResponse.success(res, null, 'Transaction deleted from database');
  } catch (error) {
    next(error);
  }
};

exports.exportData = async (req, res, next) => {
  try {
    const moduleName = req.params.module || 'analytics';
    const csvContent = `Module,ExportedAt,Status\n${moduleName},${new Date().toISOString()},Success\n`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=spy_salon_${moduleName}_export.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// ================= ENQUIRY & LEADS CRM =================
exports.getEnquiries = async (req, res, next) => {
  try {
    const { status, q } = req.query;
    let query = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { enquiryId: regex },
        { message: regex }
      ];
    }
    const list = await Enquiry.find(query).sort({ createdAt: -1 });

    return ApiResponse.success(res, list, 'Enquiries list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getEnquiryStats = async (req, res, next) => {
  try {
    const list = await Enquiry.find({});
    
    const stats = {
      total: list.length,
      new: list.filter(e => e.status === 'New').length,
      contacted: list.filter(e => e.status === 'Contacted').length,
      inProgress: list.filter(e => e.status === 'In Progress').length,
      resolved: list.filter(e => e.status === 'Resolved').length,
      closed: list.filter(e => e.status === 'Closed').length
    };

    return ApiResponse.success(res, stats, 'Enquiry statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { enquiryId: id };
    const updatedRecord = await Enquiry.findOneAndUpdate(
      query,
      { 
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes })
      },
      { new: true }
    );

    if (!updatedRecord) {
      throw ApiError.notFound('Enquiry record not found');
    }

    // Broadcast real-time Socket.io update
    const io = req.app.get('io');
    if (io) {
      io.emit('enquiry_updated', updatedRecord);
    }

    // Non-blocking background resolutions
    setImmediate(() => {
      // Dispatch notification
      Notification.create({
        title: `Inquiry #${updatedRecord.enquiryId} Status: ${updatedRecord.status}`,
        message: `Your inquiry ${updatedRecord.enquiryId} status has been updated to "${updatedRecord.status}".`,
        recipientRole: 'customer',
        recipientUserId: null,
        type: 'enquiry'
      }).catch(err => console.error('[NotificationController] Error dispatching enquiry notification:', err.message));

      if (status === 'Closed' || status === 'Resolved') {
        sendEnquiryResolutionEmail({
          email: updatedRecord.email,
          name: updatedRecord.name,
          enquiryId: updatedRecord.enquiryId,
          status: updatedRecord.status,
          adminNotes: updatedRecord.adminNotes || adminNotes || '',
          message: updatedRecord.message || ''
        }).catch(err => console.error('[EmailService] Failed to send resolution thank-you email:', err.message));
      }
    });

    return ApiResponse.success(res, updatedRecord, `Enquiry status updated to ${updatedRecord.status || 'Updated'}`);
  } catch (error) {
    next(error);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { enquiryId: id };
    
    await Enquiry.deleteOne(query);

    const io = req.app.get('io');
    if (io) {
      io.emit('enquiry_deleted', { id });
    }

    return ApiResponse.success(res, null, 'Enquiry record deleted successfully');
  } catch (error) {
    next(error);
  }
};
