const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');

// Protect all staff/employee routes
router.use(protect);
router.use(authorize('employee', 'admin', 'manager', 'receptionist'));

// Assigned Appointments
router.get('/appointments', employeeController.getAssignedAppointments);
router.post('/appointments/walkin', validateRequest({ required: ['customerName', 'customerPhone', 'service'] }), employeeController.createEmployeeWalkIn);
router.put('/appointments/:id/status', employeeController.updateAppointmentStatus);

// Attendance Clock-in, Clock-out & Log
router.post('/clock-in', employeeController.clockInAttendance);
router.post('/clock-out', employeeController.clockOutAttendance);
router.get('/attendance', employeeController.getEmployeeAttendance);

// Leaves Submission & History
router.post('/leaves', validateRequest({ required: ['leaveType', 'startDate', 'endDate'] }), employeeController.submitLeaveRequest);
router.get('/leaves', employeeController.getEmployeeLeaves);

// Payroll & Salary Slips
router.get('/payrolls', employeeController.getEmployeePayrolls);

// Bank & UPI Payout Details Update
router.put('/bank-details', validateRequest({ required: ['accountHolderName', 'bankName', 'accountNumber', 'ifscCode'] }), employeeController.updateBankDetails);

// Employee Calendar Overview
router.get('/calendar', employeeController.getCalendarOverview);

module.exports = router;
