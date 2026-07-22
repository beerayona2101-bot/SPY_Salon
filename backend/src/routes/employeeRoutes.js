const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Assigned Appointments
router.get('/appointments', employeeController.getAssignedAppointments);
router.post('/appointments/walkin', employeeController.createEmployeeWalkIn);
router.put('/appointments/:id/status', employeeController.updateAppointmentStatus);

// Attendance Clock-in & Log
router.post('/clock-in', employeeController.clockInAttendance);
router.get('/attendance', employeeController.getEmployeeAttendance);

// Leaves Submission & History
router.post('/leaves', employeeController.submitLeaveRequest);
router.get('/leaves', employeeController.getEmployeeLeaves);

// Payroll & Salary Slips
router.get('/payrolls', employeeController.getEmployeePayrolls);

// Bank & UPI Payout Details Update
router.put('/bank-details', employeeController.updateBankDetails);

module.exports = router;
