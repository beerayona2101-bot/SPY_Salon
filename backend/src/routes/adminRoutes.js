const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Analytics & Reports
router.get('/analytics', adminController.getAnalytics);
router.get('/activity-logs', adminController.getActivityLogs);
router.get('/notifications', adminController.getNotifications);
router.get('/export/:module', adminController.exportData);

// Employee Routes (CRUD)
router.get('/employees', adminController.getEmployees);
router.get('/employees/:id', adminController.getEmployeeById);
router.post('/employees', adminController.createEmployee);
router.put('/employees/:id', adminController.updateEmployee);
router.delete('/employees/:id', adminController.deleteEmployee);

// Customer Routes (CRUD)
router.get('/customers', adminController.getCustomers);
router.post('/customers', adminController.createCustomer);
router.put('/customers/:id', adminController.updateCustomer);
router.delete('/customers/:id', adminController.deleteCustomer);

// Service Routes (CRUD)
router.get('/services', adminController.getAdminServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Appointment Routes (CRUD)
router.get('/appointments', adminController.getAdminAppointments);
router.post('/appointments', adminController.createAdminAppointment);
router.put('/appointments/:id', adminController.updateAppointmentStatus);
router.delete('/appointments/:id', adminController.deleteAppointment);

// Leave Routes
router.get('/leaves', adminController.getLeaves);
router.post('/leaves', adminController.createLeave);
router.put('/leaves/:id/status', adminController.updateLeaveStatus);
router.put('/leaves/:id', adminController.updateLeaveStatus);
router.delete('/leaves/:id', adminController.deleteLeave);

// Attendance Routes
router.get('/attendance', adminController.getAttendance);
router.post('/attendance', adminController.recordAttendance);

// Reviews Moderation Routes
router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:id', adminController.deleteReview);

// Payroll & Salary Slip Routes
router.get('/payrolls', adminController.getPayrolls);
router.post('/payrolls', adminController.createPayroll);
router.put('/payrolls/:id/status', adminController.updatePayrollStatus);
router.delete('/payrolls/:id', adminController.deletePayroll);

module.exports = router;
