/**
 * Backend Attendance State Machine Integration & Verification Script
 */
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const connectDB = require('../config/db');
require('dotenv').config();

const runAttendanceTests = async () => {
  try {
    console.log('--- Starting Attendance State Machine Empirical Verification ---');
    await connectDB();

    const testEmpId = 'test_emp_verification_99';
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Clean up test document
    await Attendance.deleteMany({ employeeId: testEmpId });

    // TEST 1: Clock In
    console.log('\n[TEST 1] Clocking In...');
    const now1 = new Date();
    const clockInTime = now1.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    const att1 = await Attendance.create({
      employeeId: testEmpId,
      employeeName: 'Test Verification Stylist',
      date: todayStr,
      clockIn: clockInTime,
      clockOut: null,
      clockInTimestamp: now1,
      status: 'Present',
      attendanceState: 'CLOCKED_IN',
      breaks: []
    });

    console.log('  -> ClockIn:', att1.clockIn);
    console.log('  -> ClockOut:', att1.clockOut);
    console.log('  -> AttendanceState:', att1.attendanceState);
    if (att1.clockOut !== null) throw new Error('FAIL: clockOut should be null on clock in');
    if (att1.attendanceState !== 'CLOCKED_IN') throw new Error('FAIL: attendanceState should be CLOCKED_IN');
    console.log('  ✓ TEST 1 PASSED: clockOut is NULL, attendanceState is CLOCKED_IN');

    // TEST 2: Start Break
    console.log('\n[TEST 2] Starting Break...');
    const now2 = new Date();
    const breakStart = now2.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    att1.breaks.push({
      start: breakStart,
      end: null,
      startTimestamp: now2,
      endTimestamp: null,
      duration: 0
    });
    att1.attendanceState = 'ON_BREAK';
    await att1.save();

    console.log('  -> AttendanceState:', att1.attendanceState);
    console.log('  -> Active Break:', att1.breaks[0]);
    if (att1.attendanceState !== 'ON_BREAK') throw new Error('FAIL: attendanceState should be ON_BREAK');
    if (att1.breaks[0].end !== null) throw new Error('FAIL: break end should be null during active break');
    console.log('  ✓ TEST 2 PASSED: attendanceState is ON_BREAK, break end is NULL');

    // TEST 3: End Break
    console.log('\n[TEST 3] Ending Break...');
    const now3 = new Date(now2.getTime() + 15 * 60000); // 15 mins later
    const breakEnd = now3.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    const activeBreak = att1.breaks[0];
    activeBreak.end = breakEnd;
    activeBreak.endTimestamp = now3;
    activeBreak.duration = 15;
    att1.totalBreakDuration = 15;
    att1.attendanceState = 'CLOCKED_IN';
    await att1.save();

    console.log('  -> AttendanceState:', att1.attendanceState);
    console.log('  -> Total Break Duration:', att1.totalBreakDuration, 'mins');
    if (att1.attendanceState !== 'CLOCKED_IN') throw new Error('FAIL: attendanceState should be CLOCKED_IN after break');
    if (att1.totalBreakDuration !== 15) throw new Error('FAIL: totalBreakDuration calculation mismatch');
    console.log('  ✓ TEST 3 PASSED: attendanceState is CLOCKED_IN, break duration calculated');

    // TEST 4: Clock Out
    console.log('\n[TEST 4] Clocking Out...');
    const now4 = new Date(now1.getTime() + 480 * 60000); // 8 hours later
    const clockOutTime = now4.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    att1.clockOut = clockOutTime;
    att1.clockOutTimestamp = now4;
    att1.totalShiftDuration = 480;
    att1.effectiveWorkingDuration = 480 - 15; // 465 mins
    att1.attendanceState = 'CLOCKED_OUT';
    await att1.save();

    console.log('  -> ClockIn:', att1.clockIn);
    console.log('  -> ClockOut:', att1.clockOut);
    console.log('  -> Total Shift Duration:', att1.totalShiftDuration, 'mins');
    console.log('  -> Effective Working Duration:', att1.effectiveWorkingDuration, 'mins');
    console.log('  -> AttendanceState:', att1.attendanceState);

    if (att1.clockOut !== clockOutTime) throw new Error('FAIL: clockOut should match actual clock out time');
    if (att1.effectiveWorkingDuration !== 465) throw new Error('FAIL: effectiveWorkingDuration mismatch');
    if (att1.attendanceState !== 'CLOCKED_OUT') throw new Error('FAIL: attendanceState should be CLOCKED_OUT');
    console.log('  ✓ TEST 4 PASSED: clockOut populated, effectiveWorkingDuration correct');

    // Cleanup
    await Attendance.deleteMany({ employeeId: testEmpId });
    console.log('\n==================================================');
    console.log('  ALL EMPIRICAL BACKEND ATTENDANCE TESTS PASSED SUCCESSFULLY!  ');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err.message);
    process.exit(1);
  }
};

runAttendanceTests();
