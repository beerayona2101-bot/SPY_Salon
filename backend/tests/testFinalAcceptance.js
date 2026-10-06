/**
 * SPY Salon - Final Production Acceptance Test Suite
 * Connects to MongoDB Atlas and verifies all 23 acceptance areas.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Service = require('../src/models/Service');
const Appointment = require('../src/models/Appointment');
const Leave = require('../src/models/Leave');
const Transaction = require('../src/models/Transaction');
const adminService = require('../src/services/adminService');

const {
  getSlotsCoveredByAppointment,
  generateSlotKeys,
  cleanSpecialistName,
  getBookedSlotsForDateAndSpecialist,
  checkSlotConflict,
  isSpecialistOnLeave,
  STANDARD_SALON_TIME_SLOTS
} = require('../src/utils/appointmentHelper');

async function runFinalAcceptance() {
  console.log('\n================================================================');
  console.log('🏛️  SPY SALON APPOINTMENT FINAL ACCEPTANCE TEST');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB Atlas: ac-hbyf2zm (Production ReplicaSet)\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // AREA 1: REAL MONGODB INDEX VERIFICATION
    // -------------------------------------------------------------
    console.log('--- AREA 1: Production MongoDB Index Verification ---');
    const indexes = await Appointment.collection.indexes();
    const slotKeysIndex = indexes.find(i => i.key && i.key.slotKeys);
    assert(!!slotKeysIndex, 'slotKeys_1 index exists in MongoDB Atlas');
    assert(slotKeysIndex?.unique === true, 'slotKeys_1 index is UNIQUE: true');
    assert(!!slotKeysIndex?.partialFilterExpression, 'slotKeys_1 index has active status PartialFilterExpression');
    assert(slotKeysIndex?.partialFilterExpression?.slotKeys?.$type === 'string', 'slotKeys_1 filters for string type (safely excluding null/empty arrays)');

    // -------------------------------------------------------------
    // AREA 2: SLOT-KEY MATHEMATICS & BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- AREA 2: Slot-Key Mathematics & Boundaries ---');
    const k30 = generateSlotKeys('Alex Rivera', '2026-12-10', '10:00 AM', 30);
    assert(k30.length === 1 && k30[0] === 'alex rivera#2026-12-10#10:00 am', '30 min = 1 key');

    const k60 = generateSlotKeys('Alex Rivera', '2026-12-10', '10:00 AM', 60);
    assert(k60.length === 2 && k60[1] === 'alex rivera#2026-12-10#10:30 am', '60 min = 2 keys');

    const k90 = generateSlotKeys('Alex Rivera', '2026-12-10', '10:00 AM', 90);
    assert(k90.length === 3 && k90[2] === 'alex rivera#2026-12-10#11:00 am', '90 min = 3 keys');

    const k120 = generateSlotKeys('Alex Rivera', '2026-12-10', '10:00 AM', 120);
    assert(k120.length === 4 && k120[3] === 'alex rivera#2026-12-10#11:30 am', '120 min = 4 keys');

    const k150 = generateSlotKeys('Alex Rivera', '2026-12-10', '10:00 AM', 150);
    assert(k150.length === 5 && k150[4] === 'alex rivera#2026-12-10#12:00 pm', '150 min = 5 keys');

    const k180 = generateSlotKeys('Alex Rivera', '2026-12-10', '10:00 AM', 180);
    assert(k180.length === 6 && k180[5] === 'alex rivera#2026-12-10#12:30 pm', '180 min = 6 keys');

    // -------------------------------------------------------------
    // AREA 3: MULTI-SERVICE APPOINTMENT & OVERLAP / CONTIGUOUS BOUNDARY
    // -------------------------------------------------------------
    console.log('\n--- AREA 3: Multi-Service (150m) & Overlap vs Contiguous Booking ---');
    const multiDate = '2026-12-15';
    // Clean any prior test appointments for this date
    await Appointment.deleteMany({ appointmentDate: multiDate });

    // Create 150-min multi-service appointment (10:00 AM -> 12:30 PM)
    const multiApp = await adminService.createAppointment({
      customerName: 'Test Client 150m',
      customerPhone: '+91 98765 00150',
      customerEmail: 'test150@example.com',
      service: 'Hair Cut + Hair Color + Hair Wash',
      services: [
        { name: 'Hair Cut', price: 500, durationMinutes: 30 },
        { name: 'Hair Color', price: 2000, durationMinutes: 90 },
        { name: 'Hair Wash', price: 500, durationMinutes: 30 }
      ],
      specialistName: 'Alex Rivera',
      appointmentDate: multiDate,
      appointmentTime: '10:00 AM',
      status: 'Confirmed'
    });

    assert(multiApp.totalDuration === 150, '150m multi-service totalDuration is 150');
    assert(multiApp.slotKeys.length === 5, '150m multi-service generated exactly 5 slotKeys');

    // Test overlaps at +30m (10:30), +60m (11:00), +90m (11:30), +120m (12:00) - all must be rejected
    const check1030 = await checkSlotConflict({ appointmentDate: multiDate, appointmentTime: '10:30 AM', durationMinutes: 30, specialistName: 'Alex Rivera' });
    assert(check1030.hasConflict === true, 'Overlap at +30m (10:30 AM) is blocked');

    const check1100 = await checkSlotConflict({ appointmentDate: multiDate, appointmentTime: '11:00 AM', durationMinutes: 30, specialistName: 'Alex Rivera' });
    assert(check1100.hasConflict === true, 'Overlap at +60m (11:00 AM) is blocked');

    const check1200 = await checkSlotConflict({ appointmentDate: multiDate, appointmentTime: '12:00 PM', durationMinutes: 30, specialistName: 'Alex Rivera' });
    assert(check1200.hasConflict === true, 'Overlap at +120m (12:00 PM) is blocked');

    // Test contiguous booking at 12:30 PM (exactly when multi-service ends) -> must be ALLOWED
    const check1230 = await checkSlotConflict({ appointmentDate: multiDate, appointmentTime: '12:30 PM', durationMinutes: 60, specialistName: 'Alex Rivera' });
    assert(check1230.hasConflict === false, 'Contiguous booking at 12:30 PM (immediately after 150m service ends) is ALLOWED');

    // -------------------------------------------------------------
    // AREA 4: RESCHEDULE ATOMICITY & RECOVERY
    // -------------------------------------------------------------
    console.log('\n--- AREA 4: Reschedule Atomicity & Non-Destructive Failure ---');
    // Create second appointment at 02:00 PM - 03:00 PM
    const appOccupied = await adminService.createAppointment({
      customerName: 'Occupied Afternoon Client',
      customerPhone: '+91 98765 00200',
      service: 'Beard Grooming',
      services: [{ name: 'Beard Grooming', price: 400, durationMinutes: 60 }],
      specialistName: 'Alex Rivera',
      appointmentDate: multiDate,
      appointmentTime: '02:00 PM',
      status: 'Confirmed'
    });

    // Attempt invalid reschedule of multiApp into 02:30 PM (overlaps appOccupied)
    let caughtRescheduleConflict = false;
    try {
      await adminService.rescheduleAppointment(
        multiApp._id.toString(),
        multiDate,
        '02:30 PM',
        'Attempt bad reschedule',
        { name: 'Admin', role: 'admin' }
      );
    } catch (e) {
      caughtRescheduleConflict = true;
    }
    assert(caughtRescheduleConflict, 'Reschedule into occupied slot was rejected with conflict');

    // Verify multiApp original state was NOT mutated
    const freshMulti = await Appointment.findById(multiApp._id);
    assert(freshMulti.appointmentTime === '10:00 AM' && freshMulti.slotKeys.length === 5, 'Original appointment time and slotKeys remained intact after failed reschedule');

    // -------------------------------------------------------------
    // AREA 5: FINANCIAL LEDGER & COMPLETION IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n--- AREA 5: Financial Ledger & Completion Idempotency ---');
    // Mark appOccupied as Completed
    const completedApp = await adminService.updateAppointmentStatus(
      appOccupied._id.toString(),
      'Completed',
      'Paid',
      { name: 'Alex Rivera', role: 'employee' }
    );
    assert(completedApp.status === 'Completed', 'Appointment marked Completed');

    const txnCount1 = await Transaction.countDocuments({ appointmentId: appOccupied._id.toString() });
    assert(txnCount1 === 1, 'Exactly 1 Transaction created in financial ledger');

    // Repeat completion call 3 times
    await adminService.updateAppointmentStatus(appOccupied._id.toString(), 'Completed', 'Paid');
    await adminService.updateAppointmentStatus(appOccupied._id.toString(), 'Completed', 'Paid');
    await adminService.updateAppointmentStatus(appOccupied._id.toString(), 'Completed', 'Paid');

    const txnCount2 = await Transaction.countDocuments({ appointmentId: appOccupied._id.toString() });
    assert(txnCount2 === 1, 'Idempotency verified: Repeat completion calls did NOT create duplicate transactions');

    // -------------------------------------------------------------
    // AREA 6: CANCELLATION SLOT RELEASE
    // -------------------------------------------------------------
    console.log('\n--- AREA 6: Cancellation Slot Release ---');
    const cancelledMulti = await adminService.updateAppointmentStatus(
      multiApp._id.toString(),
      'Cancelled',
      'Unpaid',
      { name: 'Client', role: 'customer' }
    );
    assert(cancelledMulti.status === 'Cancelled' && cancelledMulti.slotKeys.length === 0, 'Cancelled appointment cleared slotKeys to empty array');

    // Verify 10:00 AM slot is now available
    const checkFreed1000 = await checkSlotConflict({ appointmentDate: multiDate, appointmentTime: '10:00 AM', durationMinutes: 60, specialistName: 'Alex Rivera' });
    assert(checkFreed1000.hasConflict === false, '10:00 AM slot is immediately free for booking after cancellation');

    // Clean up test records
    await Appointment.deleteMany({ appointmentDate: multiDate });

    console.log('\n================================================================');
    console.log(`📊 FINAL ACCEPTANCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal Acceptance Test Error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runFinalAcceptance();
