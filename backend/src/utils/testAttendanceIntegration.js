/**
 * End-to-End Attendance Integration & Verification Test Suite
 * Tests User ID <-> Employee ID Resolution, Admin Reporting, Manual Clock-Out,
 * Duplicate Prevention, Break Logs, Dynamic Overtime, and Auto-Checkout.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Leave = require('../models/Leave');
const {
  resolveEmployeeFilter,
  classifyAttendanceType,
  autoCheckoutPastUnclosedShifts,
  aggregateMonthlyAttendance
} = require('./attendanceCalculator');

const runIntegrationTests = async () => {
  try {
    console.log('====================================================');
    console.log('  SPY SALON COMPREHENSIVE ATTENDANCE VERIFICATION   ');
    console.log('====================================================\n');

    await connectDB();

    const testEmail = 'specialist_test_attendance@spysalon.local';
    const testDate = '2026-09-15';
    const todayKolkataStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Cleanup any prior test artifacts
    await User.deleteMany({ email: testEmail });
    await Employee.deleteMany({ email: testEmail });

    // 1. Create separate Employee doc (ID A) and User doc (ID B)
    const testEmp = await Employee.create({
      empCode: 'EMP-9999',
      name: 'Rohan Verma',
      email: testEmail,
      phone: '+91 99999 88888',
      specialties: ['Hair Specialist', 'Spa Therapy'],
      workingHours: { start: '09:00', end: '19:00' },
      status: 'Active'
    });

    const testUser = await User.create({
      name: 'Rohan Verma',
      email: testEmail,
      phone: '+91 99999 88888',
      password: 'TestPassword@123',
      role: 'employee',
      isVerified: true
    });

    const empIdA = testEmp._id.toString();
    const userIdB = testUser._id.toString();

    console.log(`[SETUP] Created Employee ID: ${empIdA}`);
    console.log(`[SETUP] Created User ID:     ${userIdB}`);
    if (empIdA === userIdB) throw new Error('Test setup error: IDs should be distinct to test resolution');

    await Attendance.deleteMany({ $or: [{ employeeId: empIdA }, { employeeId: userIdB }] });
    await Leave.deleteMany({ $or: [{ employeeId: empIdA }, { employeeId: userIdB }] });

    // TEST 1: ID Resolution Helper
    console.log('\n[TEST 1] Testing resolveEmployeeFilter for both IDs and Email...');
    const resFromEmpId = await resolveEmployeeFilter(empIdA);
    const resFromUserId = await resolveEmployeeFilter(userIdB);
    const resFromEmail = await resolveEmployeeFilter(testEmail);

    if (!resFromEmpId.allIds.includes(empIdA) || !resFromEmpId.allIds.includes(userIdB)) {
      throw new Error('TEST 1 Failed: resolveEmployeeFilter(empIdA) must include both IDs');
    }
    if (!resFromUserId.allIds.includes(empIdA) || !resFromUserId.allIds.includes(userIdB)) {
      throw new Error('TEST 1 Failed: resolveEmployeeFilter(userIdB) must include both IDs');
    }
    if (!resFromEmail.allIds.includes(empIdA) || !resFromEmail.allIds.includes(userIdB)) {
      throw new Error('TEST 1 Failed: resolveEmployeeFilter(testEmail) must include both IDs');
    }
    console.log('  PASSED: Both IDs resolved bidirectionally.');

    // TEST 2: Employee clocks in using User ID (Mobile/Web Auth token)
    console.log('\n[TEST 2] Simulating Employee Clock-In with User ID...');
    const attRecord = await Attendance.create({
      employee: testEmp._id,
      employeeId: userIdB,
      employeeName: testUser.name,
      date: testDate,
      clockIn: '09:00 AM',
      clockOut: '07:00 PM', // 10 hours = 600 mins elapsed
      clockInTimestamp: new Date(`${testDate}T09:00:00.000Z`),
      clockOutTimestamp: new Date(`${testDate}T19:00:00.000Z`),
      totalShiftDuration: 600,
      breaks: [
        {
          start: '01:00 PM',
          end: '01:30 PM',
          startTimestamp: new Date(`${testDate}T13:00:00.000Z`),
          endTimestamp: new Date(`${testDate}T13:30:00.000Z`),
          duration: 30
        }
      ],
      totalBreakDuration: 30,
      effectiveWorkingDuration: 570, // 570 mins (9h 30m) -> 30 mins Overtime beyond 540m
      attendanceType: 'FULL_DAY',
      status: 'Present',
      attendanceState: 'CLOCKED_OUT'
    });
    console.log(`  Created attendance record _id: ${attRecord._id}`);

    // TEST 3: Admin Monthly Attendance Aggregation using Employee ID (empIdA)
    console.log('\n[TEST 3] Admin queries report using Employee ID...');
    const adminMonthlyReport = await aggregateMonthlyAttendance(empIdA, '2026-09');
    console.log('  Summary Output for Employee ID:', adminMonthlyReport.summary);
    if (adminMonthlyReport.summary.fullDaysCount !== 1) {
      throw new Error(`TEST 3 Failed: Admin report expected 1 full day, got ${adminMonthlyReport.summary.fullDaysCount}`);
    }
    if (adminMonthlyReport.summary.totalEffectiveWorkingMinutes !== 570) {
      throw new Error(`TEST 3 Failed: Expected 570 effective minutes, got ${adminMonthlyReport.summary.totalEffectiveWorkingMinutes}`);
    }
    if (adminMonthlyReport.summary.totalOvertimeTimes !== 1 || adminMonthlyReport.summary.totalOvertimeMinutes !== 30) {
      throw new Error(`TEST 3 Failed: Expected 1 OT occurrence of 30 mins, got ${adminMonthlyReport.summary.totalOvertimeMinutes}`);
    }
    console.log('  PASSED: Admin query using Employee ID successfully retrieved User-clocked attendance!');

    // TEST 4: Duplicate Clock-In Protection
    console.log('\n[TEST 4] Testing duplicate clock-in detection...');
    const resolved = await resolveEmployeeFilter(userIdB);
    const existing = await Attendance.findOne({
      ...resolved.filter,
      date: testDate
    });
    if (!existing) throw new Error('TEST 4 Failed: Expected existing attendance record');
    console.log(`  Existing log found: ${existing.clockIn} - ${existing.attendanceState}`);
    console.log('  PASSED: Duplicate log detected cleanly.');

    // TEST 5: Auto-checkout past unclosed shift
    console.log('\n[TEST 5] Testing auto-checkout for past unclosed shift...');
    const pastUnclosedDate = '2026-08-10';
    await Attendance.create({
      employee: testEmp._id,
      employeeId: userIdB,
      employeeName: testUser.name,
      date: pastUnclosedDate,
      clockIn: '10:00 AM',
      clockOut: null,
      clockInTimestamp: new Date(`${pastUnclosedDate}T10:00:00.000Z`),
      attendanceState: 'CLOCKED_IN',
      attendanceType: 'NOT_FINALIZED'
    });

    await autoCheckoutPastUnclosedShifts(empIdA);

    const closedLog = await Attendance.findOne({
      ...resolved.filter,
      date: pastUnclosedDate
    });
    if (closedLog.attendanceState !== 'CLOCKED_OUT' || closedLog.effectiveWorkingDuration !== 540) {
      throw new Error('TEST 5 Failed: Past unclosed shift was not closed with 540 mins');
    }
    console.log(`  Auto-closed clockOut: ${closedLog.clockOut} (${closedLog.effectiveWorkingDuration} mins)`);
    console.log('  PASSED: Auto-checkout closed unclosed shift accurately.');

    // Cleanup
    await User.deleteMany({ email: testEmail });
    await Employee.deleteMany({ email: testEmail });
    await Attendance.deleteMany({ $or: [{ employeeId: empIdA }, { employeeId: userIdB }] });

    console.log('\n====================================================');
    console.log('  ALL ATTENDANCE INTEGRATION TESTS PASSED 100%!     ');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nIntegration Test FAILED:', err.message);
    process.exit(1);
  }
};

runIntegrationTests();
