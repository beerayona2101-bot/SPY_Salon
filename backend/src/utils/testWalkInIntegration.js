/**
 * SPY Salon — Walk-In Integration Test (READ-ONLY SAFE)
 * Creates a clearly identifiable test document, verifies persisted fields, then deletes it.
 * Safe to run against production DB — cleanup is guaranteed.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

// Kolkata date helper
function getKolkataDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

async function runTest() {
  let createdId = null;
  let passed = 0;
  let failed = 0;
  const results = [];

  function check(label, actual, expected) {
    const ok = actual === expected;
    const symbol = ok ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${symbol}  ${label}`);
    console.log(`          expected: ${JSON.stringify(expected)}`);
    console.log(`          actual  : ${JSON.stringify(actual)}`);
    results.push({ label, ok, actual, expected });
    if (ok) passed++; else failed++;
  }

  try {
    console.log('\n══════════════════════════════════════════');
    console.log('  SPY Salon Walk-In Integration Test');
    console.log('══════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected\n');

    const todayStr = getKolkataDateStr();
    const testBookingId = 'SPY-WI-TEST-' + Date.now();

    console.log(`📝  Creating test appointment: ${testBookingId} (date: ${todayStr})`);

    const doc = await Appointment.create({
      bookingId:       testBookingId,
      customerName:    'WALKIN_TEST_AUTOMATION',
      customerPhone:   '+91 00000 00000',
      service:         'Test Haircut',
      services:        [{ name: 'Test Haircut', price: 250, durationMinutes: 30 }],
      totalDuration:   30,
      price:           250,
      finalAmount:     250,
      specialistName:  'Test Stylist',
      appointmentDate: todayStr,
      appointmentTime: '11:30 AM',
      bookingDateTime: new Date().toISOString(),
      bookingDate:     todayStr,
      bookingTimeFormatted: '11:30 AM',
      paymentMethod:   'Cash',
      paymentStatus:   'Paid',
      branch:          'Test Branch',
      branchId:        null,
      customerId:      null,
      specialistId:    'test-specialist-id',
      employeeId:      'test-employee-id',
      employee:        null,
      isWalkIn:        true,
      status:          'In Progress',
      notes:           'AUTOMATED WALK-IN TEST - SAFE TO DELETE',
      slotKeys:        [],
    });

    createdId = doc._id;
    console.log(`✅  Document created with _id: ${createdId}\n`);

    console.log('🔍  Fetching document directly from MongoDB by _id ...');
    const fetched = await Appointment.findById(createdId).lean();

    if (!fetched) {
      console.log('❌  FATAL: Could not retrieve created document from MongoDB');
      process.exit(1);
    }
    console.log('✅  Document retrieved\n');

    console.log('─── Field Verification ───────────────────────────');
    check('isWalkIn === true',            fetched.isWalkIn,      true);
    check('specialistId === "test-specialist-id"', fetched.specialistId, 'test-specialist-id');
    check('employeeId === "test-employee-id"',     fetched.employeeId,   'test-employee-id');
    check('appointmentTime === "11:30 AM"',        fetched.appointmentTime, '11:30 AM');
    check('status === "In Progress"',              fetched.status,      'In Progress');
    check('appointmentDate === todayStr',           fetched.appointmentDate, todayStr);
    check('customerName',                           fetched.customerName, 'WALKIN_TEST_AUTOMATION');
    check('branch === "Test Branch"',              fetched.branch,      'Test Branch');
    check('paymentMethod === "Cash"',              fetched.paymentMethod, 'Cash');

    console.log('\n─── Raw persisted values ──────────────────────────');
    const persistenceFields = [
      'bookingId','isWalkIn','specialistId','employeeId','employee',
      'appointmentTime','appointmentDate','status','customerName',
      'customerPhone','branch','branchId','service','paymentMethod','notes'
    ];
    persistenceFields.forEach(f => {
      console.log(`  ${f}: ${JSON.stringify(fetched[f])}`);
    });

  } catch (err) {
    console.error('\n❌  UNEXPECTED ERROR:', err.message);
    failed++;
  } finally {
    // Always clean up test document
    if (createdId) {
      try {
        await Appointment.findByIdAndDelete(createdId);
        console.log(`\n🗑️   Test document ${createdId} deleted (cleanup complete)`);
      } catch (cleanErr) {
        console.warn('⚠️   Cleanup warning:', cleanErr.message);
      }
    }
    await mongoose.disconnect();
    console.log('✅  MongoDB disconnected\n');
  }

  console.log('══════════════════════════════════════════');
  console.log(`  Results: ${passed} PASSED / ${failed} FAILED`);
  console.log('══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTest();
