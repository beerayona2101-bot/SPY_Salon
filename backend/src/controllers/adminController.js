/**
 * Production-Level Admin Controller for SPY Salon Enterprise REST API
 * Consumes AdminService and returns standardized ApiResponse objects.
 */
const adminService = require('../services/adminService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const store = require('../data/store');
const Enquiry = require('../models/Enquiry');
const { sendEnquiryResolutionEmail } = require('../services/emailService');
const { dispatchNotification } = require('./notificationController');

// ================= ANALYTICS & REPORTS =================
exports.getAnalytics = async (req, res, next) => {
  try {
    const summary = await adminService.getAnalyticsSummary();
    return ApiResponse.success(res, summary, 'Analytics summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const result = await adminService.getActivityLogs(req.query);
    return ApiResponse.paginated(res, result.data, 1, result.data.length, result.total, 'Activity logs retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await adminService.getNotifications();
    return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    if (store.notifications) {
      store.notifications.forEach(n => {
        if (!notificationId || String(n._id) === String(notificationId)) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
    }
    const { broadcastEvent } = require('../utils/socket');
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
    const result = await adminService.getEmployees(req.query);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Employees list retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await adminService.getEmployeeById(req.params.id);
    return ApiResponse.success(res, employee, 'Employee profile retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const result = await adminService.createEmployee(req.body);
    return ApiResponse.created(res, result.data, 'Employee registered successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const updated = await adminService.updateEmployee(req.params.id, req.body);
    return ApiResponse.success(res, updated, 'Employee profile updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
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
    const result = await adminService.getServices(req.query);
    return ApiResponse.success(res, result.data, 'Services menu retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const created = await adminService.createService(req.body);
    return ApiResponse.created(res, created, 'New service added to pricing menu');
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const updated = await adminService.updateService(req.params.id, req.body);
    return ApiResponse.success(res, updated, 'Service item updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    await adminService.deleteService(req.params.id);
    return ApiResponse.success(res, null, 'Service item removed from menu');
  } catch (error) {
    next(error);
  }
};

// ================= APPOINTMENTS DESK =================
exports.getAdminAppointments = async (req, res, next) => {
  try {
    const result = await adminService.getAppointments(req.query);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Appointments list retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createAdminAppointment = async (req, res, next) => {
  try {
    const created = await adminService.createAppointment(req.body);
    return ApiResponse.created(res, created, 'Appointment booked successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const updated = await adminService.updateAppointmentStatus(req.params.id, req.body.status || 'Confirmed');
    return ApiResponse.success(res, updated, 'Appointment status updated');
  } catch (error) {
    next(error);
  }
};

exports.respondReschedule = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const updated = await adminService.respondReschedule(req.params.id, action || 'Approve', rejectionReason);
    return ApiResponse.success(res, updated, `Reschedule request ${action === 'Reject' ? 'rejected' : 'approved'}`);
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    await adminService.deleteAppointment(req.params.id);
    return ApiResponse.success(res, null, 'Appointment cancelled and removed');
  } catch (error) {
    next(error);
  }
};

// ================= LEAVES & ATTENDANCE =================
exports.getLeaves = async (req, res, next) => {
  try {
    return ApiResponse.success(res, store.leaves, 'Leave applications retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createLeave = async (req, res, next) => {
  try {
    const newLeave = {
      _id: `leave_${Date.now()}`,
      employeeName: req.body.employeeName || 'Staff Member',
      startDate: req.body.startDate || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate || new Date().toISOString().split('T')[0],
      reason: req.body.reason || 'Personal leave request',
      status: 'Pending'
    };
    store.leaves.unshift(newLeave);
    return ApiResponse.created(res, newLeave, 'Leave application submitted');
  } catch (error) {
    next(error);
  }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const leave = store.leaves.find(l => String(l._id) === String(req.params.id));
    if (!leave) throw ApiError.notFound('Leave request not found');

    leave.status = req.body.status || 'Approved';
    return ApiResponse.success(res, leave, `Leave request ${leave.status.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
};

exports.deleteLeave = async (req, res, next) => {
  try {
    const index = store.leaves.findIndex(l => String(l._id) === String(req.params.id));
    if (index !== -1) store.leaves.splice(index, 1);
    return ApiResponse.success(res, null, 'Leave record deleted');
  } catch (error) {
    next(error);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    return ApiResponse.success(res, store.attendance, 'Attendance records retrieved');
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const report = store.getEmployeeAttendanceMetrics();
    return ApiResponse.success(res, report, 'Employee attendance report cards generated');
  } catch (error) {
    next(error);
  }
};

exports.recordAttendance = async (req, res, next) => {
  try {
    const newLog = {
      _id: `att_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      clockIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clockOut: '19:00',
      status: 'Present',
      employeeName: req.body.employeeName || 'Staff Member'
    };
    store.attendance.unshift(newLog);
    return ApiResponse.created(res, newLog, 'Clock-in recorded');
  } catch (error) {
    next(error);
  }
};

// ================= REVIEWS MODERATION =================
exports.getReviews = async (req, res, next) => {
  try {
    return ApiResponse.success(res, store.reviews, 'Reviews retrieved');
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const index = store.reviews.findIndex(r => String(r._id) === String(req.params.id));
    if (index !== -1) store.reviews.splice(index, 1);
    return ApiResponse.success(res, null, 'Review comment removed');
  } catch (error) {
    next(error);
  }
};

// ================= PAYROLLS & SALARY SLIPS =================
exports.getPayrolls = async (req, res, next) => {
  try {
    return ApiResponse.success(res, store.payrolls, 'Payroll slips retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createPayroll = async (req, res, next) => {
  try {
    const base = Number(req.body.baseSalary || 45000);
    const inc = Number(req.body.incentives || 5000);
    const ded = Number(req.body.deductions || 1000);
    const net = base + inc - ded;

    const slip = {
      _id: `pay_${Date.now()}`,
      slipId: `PAY-2026-07-${Math.floor(100 + Math.random() * 900)}`,
      employeeName: req.body.employeeName || 'Ananya Sharma',
      empCode: 'EMP-1001',
      month: req.body.month || 'July 2026',
      baseSalary: base,
      incentives: inc,
      deductions: ded,
      netPay: net,
      paymentMethod: req.body.paymentMethod || 'Bank Transfer (HDFC)',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'Paid'
    };

    store.payrolls.unshift(slip);
    store.addTransaction('Debited', 'Staff Payroll Disbursal', `Monthly Salary Disbursal - ${slip.employeeName} (${slip.empCode})`, net, slip.paymentMethod, 'Settled');
    store.logActivity('Payroll Slip Issued', `Disbursed salary of ₹${net} to ${slip.employeeName}.`);

    return ApiResponse.created(res, slip, 'Salary slip generated and payroll transaction logged');
  } catch (error) {
    next(error);
  }
};

exports.updatePayrollStatus = async (req, res, next) => {
  try {
    const slip = store.payrolls.find(p => String(p._id) === String(req.params.id));
    if (!slip) throw ApiError.notFound('Salary slip not found');

    slip.status = req.body.status || 'Paid';
    return ApiResponse.success(res, slip, `Payroll slip status updated to ${slip.status}`);
  } catch (error) {
    next(error);
  }
};

exports.deletePayroll = async (req, res, next) => {
  try {
    const index = store.payrolls.findIndex(p => String(p._id) === String(req.params.id));
    if (index !== -1) store.payrolls.splice(index, 1);
    return ApiResponse.success(res, null, 'Salary slip record deleted');
  } catch (error) {
    next(error);
  }
};

// ================= TRANSACTIONS LEDGER =================
exports.getTransactions = async (req, res, next) => {
  try {
    const result = await adminService.getTransactions(req.query);
    return ApiResponse.paginated(res, result.data, result.page, result.limit, result.total, 'Transactions ledger retrieved');
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const created = await adminService.createTransaction(req.body);
    return ApiResponse.created(res, created, 'Transaction entry logged successfully');
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
    let list = [];
    
    try {
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
      list = await Enquiry.find(query).sort({ createdAt: -1 });
    } catch (dbErr) {
      console.warn('[AdminController] MongoDB Enquiry fetch fallback to memory store:', dbErr.message);
      list = store.enquiries || [];
    }

    if ((!list || list.length === 0) && store.enquiries && store.enquiries.length > 0) {
      list = store.enquiries;
    }

    // Filter in-memory if needed
    if (status && status !== 'All') {
      list = list.filter(e => e.status === status);
    }
    if (q && q.trim()) {
      const queryStr = q.trim().toLowerCase();
      list = list.filter(e => 
        (e.name && e.name.toLowerCase().includes(queryStr)) ||
        (e.email && e.email.toLowerCase().includes(queryStr)) ||
        (e.phone && e.phone.toLowerCase().includes(queryStr)) ||
        (e.enquiryId && e.enquiryId.toLowerCase().includes(queryStr)) ||
        (e.message && e.message.toLowerCase().includes(queryStr))
      );
    }

    return ApiResponse.success(res, list, 'Enquiries list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.getEnquiryStats = async (req, res, next) => {
  try {
    let list = [];
    try {
      list = await Enquiry.find({});
    } catch (err) {
      list = store.enquiries || [];
    }
    if (!list || list.length === 0) {
      list = store.enquiries || [];
    }

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

    let updatedRecord = null;
    try {
      updatedRecord = await Enquiry.findByIdAndUpdate(
        id,
        { 
          ...(status && { status }),
          ...(adminNotes !== undefined && { adminNotes })
        },
        { new: true }
      );
    } catch (err) {}

    if (!updatedRecord) {
      try {
        updatedRecord = await Enquiry.findOne({ $or: [{ _id: id }, { enquiryId: id }] });
        if (updatedRecord) {
          if (status) updatedRecord.status = status;
          if (adminNotes !== undefined) updatedRecord.adminNotes = adminNotes;
          await updatedRecord.save();
        }
      } catch (err) {}
    }

    if (store.enquiries) {
      const match = store.enquiries.find(e => String(e._id) === String(id) || e.enquiryId === id);
      if (match) {
        if (status) match.status = status;
        if (adminNotes !== undefined) match.adminNotes = adminNotes;
        if (!updatedRecord) updatedRecord = match;
      }
    }

    if (!updatedRecord) {
      throw ApiError.notFound('Enquiry record not found');
    }

    // Broadcast real-time Socket.io update
    const io = req.app.get('io');
    if (io) {
      io.emit('enquiry_updated', updatedRecord);
    }

    // Non-blocking background dispatch for notifications & emails (<10ms API response time)
    setImmediate(() => {
      // 1. Generate & Dispatch In-App Notification for user Notification Bell Icon
      dispatchNotification(req.app, {
        role: 'user',
        email: updatedRecord.email ? updatedRecord.email.toLowerCase().trim() : null,
        title: `Inquiry #${updatedRecord.enquiryId} Status: ${updatedRecord.status}`,
        message: `Your inquiry ${updatedRecord.enquiryId} status has been updated to "${updatedRecord.status}".${updatedRecord.adminNotes ? ` Concierge Note: "${updatedRecord.adminNotes}"` : ''}`,
        type: 'enquiry',
        priority: updatedRecord.status === 'Closed' ? 'high' : 'normal',
        icon: 'bell'
      }).catch(err => console.error('[NotificationController] Error dispatching enquiry notification:', err.message));

      // 2. After closing or resolving inquiry, send formal resolution summary email to customer
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
    try {
      await Enquiry.findByIdAndDelete(id);
    } catch (err) {
      try {
        await Enquiry.deleteOne({ enquiryId: id });
      } catch (e2) {}
    }

    if (store.enquiries) {
      const idx = store.enquiries.findIndex(e => String(e._id) === String(id) || e.enquiryId === id);
      if (idx !== -1) {
        store.enquiries.splice(idx, 1);
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('enquiry_deleted', { id });
    }

    return ApiResponse.success(res, null, 'Enquiry record deleted successfully');
  } catch (error) {
    next(error);
  }
};
