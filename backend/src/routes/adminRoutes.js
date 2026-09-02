const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');

// Protect all administrative routes
router.use(protect);
router.use(authorize('admin', 'manager', 'receptionist'));

// Analytics & Reports
router.get('/landing-settings', adminController.getAdminLandingSettings);
router.put('/landing-settings', adminController.updateLandingSettings);
router.get('/analytics', adminController.getAnalytics);
router.get('/activity-logs', adminController.getActivityLogs);
router.post('/activity-logs', adminController.createActivityLog);
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/read', adminController.markNotificationRead);
router.get('/export/:module', adminController.exportData);

// Employee Routes (CRUD)
router.get('/employees', adminController.getEmployees);
router.get('/employees/:id', adminController.getEmployeeById);
router.post('/employees', validateRequest({ required: ['name'], email: ['email'], phone: ['phone'], name: ['name'] }), adminController.createEmployee);
router.put('/employees/:id', validateRequest({ email: ['email'], phone: ['phone'] }), adminController.updateEmployee);
router.delete('/employees/:id', adminController.deleteEmployee);

// Customer Routes (CRUD)
router.get('/customers', adminController.getCustomers);
router.post('/customers', validateRequest({ required: ['name'], email: ['email'], phone: ['phone'], name: ['name'] }), adminController.createCustomer);
router.put('/customers/:id', validateRequest({ email: ['email'], phone: ['phone'] }), adminController.updateCustomer);
router.delete('/customers/:id', adminController.deleteCustomer);

// Service Routes (CRUD)
router.get('/services', adminController.getAdminServices);
router.post('/services', validateRequest({ required: ['name'] }), adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Membership Routes (CRUD)
router.get('/memberships', adminController.getAdminMemberships);
router.post('/memberships', validateRequest({ required: ['name'] }), adminController.createMembership);
router.put('/memberships/:id', adminController.updateMembership);
router.delete('/memberships/:id', adminController.deleteMembership);

// Appointment Routes (CRUD & Reschedule Workflow)
router.get('/appointments', adminController.getAdminAppointments);
router.post('/appointments', validateRequest({ required: ['customerName', 'customerPhone', 'service'] }), adminController.createAdminAppointment);
router.put('/appointments/:id/reschedule-respond', adminController.respondReschedule);
router.put('/appointments/:id', adminController.updateAppointmentStatus);
router.delete('/appointments/:id', adminController.deleteAppointment);

// Leave Routes
router.get('/leaves', adminController.getLeaves);
router.get('/leaves/:id', adminController.getLeaveById);
router.post('/leaves', adminController.createLeave);
router.patch('/leaves/:id/approve', adminController.approveLeave);
router.patch('/leaves/:id/reject', adminController.rejectLeave);
router.put('/leaves/:id/status', adminController.updateLeaveStatus);
router.put('/leaves/:id', adminController.updateLeaveStatus);
router.delete('/leaves/:id', adminController.deleteLeave);

// Attendance Routes
router.get('/attendance', adminController.getAttendance);
router.get('/attendance/report', adminController.getAttendanceReport);
router.post('/attendance', adminController.recordAttendance);

// Reviews Moderation Routes
router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:id', adminController.deleteReview);

// Payroll & Salary Slip Routes
router.get('/payrolls', adminController.getPayrolls);
router.post('/payrolls', validateRequest({ required: ['employeeName'], nonNegativeNumber: ['baseSalary'] }), adminController.createPayroll);
router.put('/payrolls/:id/status', adminController.updatePayrollStatus);
router.delete('/payrolls/:id', adminController.deletePayroll);

// Financial Ledger & Transactions Routes
router.get('/transactions', adminController.getTransactions);
router.post('/transactions', validateRequest({ required: ['type', 'category', 'amount'], nonNegativeNumber: ['amount'] }), adminController.createTransaction);
router.delete('/transactions/:id', adminController.deleteTransaction);

// Enquiry & Lead Management Routes
router.get('/enquiries', adminController.getEnquiries);
router.get('/enquiries/stats', adminController.getEnquiryStats);
router.patch('/enquiries/:id/status', adminController.updateEnquiryStatus);
router.delete('/enquiries/:id', adminController.deleteEnquiry);

module.exports = router;
