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
router.post('/appointments/walkin', validateRequest({ required: ['customerName', 'service'] }), employeeController.createEmployeeWalkIn);
router.post('/walk-in', validateRequest({ required: ['customerName', 'service'] }), employeeController.createEmployeeWalkIn);
router.put('/appointments/:id/status', employeeController.updateAppointmentStatus);

// Staff Manual Customer Entry
router.get('/customers', employeeController.getCustomersForStaff);
router.post('/customers', validateRequest({ required: ['name', 'phone'] }), employeeController.createCustomerByStaff);

// Attendance Clock-in, Break, Clock-out & Logs
router.post('/clock-in', employeeController.clockInAttendance);
router.post('/start-break', employeeController.startBreakAttendance);
router.post('/end-break', employeeController.endBreakAttendance);
router.post('/clock-out', employeeController.clockOutAttendance);
router.get('/attendance', employeeController.getEmployeeAttendance);
router.get('/attendance/today', employeeController.getTodayAttendance);
router.get('/attendance/monthly', employeeController.getMonthlyAttendance);

// Leaves Submission & History
router.post('/leaves', employeeController.submitLeaveRequest);
router.get('/leaves', employeeController.getEmployeeLeaves);
router.get('/leaves/my', employeeController.getEmployeeLeaves);
router.get('/leaves/:id', employeeController.getLeaveById);

// Payroll & Salary Slips
router.get('/payrolls', employeeController.getEmployeePayrolls);

// Bank & UPI Payout Details Update
router.put('/bank-details', validateRequest({ required: ['accountName', 'bankName', 'accountNumber', 'ifscCode'] }), employeeController.updateBankDetails);

// Employee Calendar Overview
router.get('/calendar', employeeController.getCalendarOverview);

module.exports = router;
