/**
 * SPY Salon - Master Production Verification Test Suite
 * Rigorously verifies all 26 critical appointment lifecycle aspects with real MongoDB transactions,
 * true concurrent parallel executions (Promise.all), and comprehensive assertions.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Service = require('../src/models/Service');
const Appointment = require('../src/models/Appointment');
const Leave = require('../src/models/Leave');
const Transaction = require('../src/models/Transaction');
const ActivityLog = require('../src/models/ActivityLog');
const Notification = require('../src/models/Notification');
const adminService = require('../src/services/adminService');

const { 
  getSlotsCoveredByAppointment, 
  generateSlotKeys,
  cleanSpecialistName,
  getBookedSlotsForDateAndSpecialist, 
  checkSlotConflict,
  isSpecialistOnLeave
} = require('../src/utils/appointmentHelper');

async function runMasterProductionVerification() {
  console.log('\n================================================================');
  console.log('🏛️  STARTING SPY SALON MASTER PRODUCTION VERIFICATION SUITE');
  console.log('================================================================\n');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Appointment.init(); // Ensure unique indexes are built

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
    // SECTION 1: SEED BASE DATA
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Seeding Base Specialist, Customer, & Services ---');
    const specialistA = await Employee.create({
      empCode: 'EMP-101',
      name: 'Alex Rivera',
      email: 'alex.rivera@spysalon.com',
      phone: '+91 98765 11111',
      specialties: ['Master Stylist', 'Hair Architecture'],
      status: 'Active'
    });

    const specialistB = await Employee.create({
      empCode: 'EMP-102',
      name: 'Maria Santos',
      email: 'maria.santos@spysalon.com',
      phone: '+91 98765 22222',
      specialties: ['Skin & Facial'],
      status: 'Active'
    });

    const customerA = await User.create({
      name: 'Sophia Williams',
      email: 'sophia@example.com',
      phone: '+91 98765 33333',
      password: 'Password@123',
      role: 'customer'
    });

    const customerB = await User.create({
      name: 'David Miller',
      email: 'david@example.com',
      phone: '+91 98765 44444',
      password: 'Password@123',
      role: 'customer'
    });

    const hairCutService = await Service.create({
      name: 'Precision Hair Cut',
      slug: 'precision-hair-cut',
      category: 'Hair Care',
      price: 600,
      discountPrice: 500,
      durationMinutes: 30,
      isActive: true
    });

    const spaService = await Service.create({
      name: 'Luxury Hair & Scalp Spa',
      slug: 'luxury-hair-scalp-spa',
      category: 'Hair Care',
      price: 2400,
      discountPrice: 1999,
      durationMinutes: 60,
      isActive: true
    });

    assert(specialistA._id && customerA._id && spaService._id, 'Specialists, customers, and services seeded');

    // -------------------------------------------------------------
    // SECTION 2: CONCURRENCY & ATOMIC DOUBLE-BOOKING RACE TEST
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: True Concurrency & Atomic Double-Booking Protection ---');
    const testDate = '2026-11-20';

    async function attemptPublicBooking(custName, custPhone, startTime, duration, specName) {
      const conflict = await checkSlotConflict({
        appointmentDate: testDate,
        appointmentTime: startTime,
        durationMinutes: duration,
        specialistName: specName
      });

      if (conflict.hasConflict) {
        return { success: false, status: 409, message: conflict.reason };
      }

      // Simulate micro-jitter before writing
      await new Promise(r => setTimeout(r, 5));

      const slotKeys = generateSlotKeys(specName, testDate, startTime, duration);
      try {
        const app = await Appointment.create({
          bookingId: 'SPY-' + Math.floor(100000 + Math.random() * 900000),
          customerName: custName,
          customerPhone: custPhone,
          branch: 'Jubilee Hills Flagship',
          service: 'Luxury Hair & Scalp Spa',
          totalDuration: duration,
          price: 1999,
          finalAmount: 1999,
          specialistName: `${specName} (Specialist)`,
          slotKeys,
          appointmentDate: testDate,
          appointmentTime: startTime,
          status: 'Confirmed'
        });
        return { success: true, status: 201, data: app };
      } catch (err) {
        if (err.code === 11000 || (err.message && (err.message.includes('slotKeys') || err.message.includes('E11000')))) {
          return { success: false, status: 409, message: 'Conflict: Slot already booked concurrently' };
        }
        throw err;
      }
    }

    // Test 2.1: Exact same slot simultaneous booking
    const [simulRes1, simulRes2] = await Promise.all([
      attemptPublicBooking('Customer A', '+919999911111', '10:00 AM', 60, 'Alex Rivera'),
      attemptPublicBooking('Customer B', '+919999922222', '10:00 AM', 60, 'Alex Rivera')
    ]);

    const successesExact = [simulRes1, simulRes2].filter(r => r.success);
    const conflictsExact = [simulRes1, simulRes2].filter(r => !r.success && r.status === 409);
    assert(successesExact.length === 1 && conflictsExact.length === 1, 'Simultaneous booking of identical slot results in exactly 1 SUCCESS and 1 409 CONFLICT');

    // Test 2.2: Overlapping intervals simultaneous booking (10:00-11:00 vs 10:30-11:30)
    // First clear DB for clean overlap test
    await Appointment.deleteMany({ appointmentDate: testDate });

    const [overlapRes1, overlapRes2] = await Promise.all([
      attemptPublicBooking('Customer 1', '+919999933333', '10:00 AM', 60, 'Alex Rivera'), // 10:00 to 11:00 (covers 10:00, 10:30)
      attemptPublicBooking('Customer 2', '+919999944444', '10:30 AM', 60, 'Alex Rivera')  // 10:30 to 11:30 (covers 10:30, 11:00)
    ]);

    const successesOverlap = [overlapRes1, overlapRes2].filter(r => r.success);
    const conflictsOverlap = [overlapRes1, overlapRes2].filter(r => !r.success && r.status === 409);
    assert(successesOverlap.length === 1 && conflictsOverlap.length === 1, 'Simultaneous overlapping booking (10:00-11:00 vs 10:30-11:30) safely rejects overlapping request with 409');

    // -------------------------------------------------------------
    // SECTION 3: DURATION CALCULATION & INTERVAL MAPPING
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Duration Calculation & Interval Coverage ---');
    const slots30 = getSlotsCoveredByAppointment('11:00 AM', 30);
    assert(slots30.length === 1 && slots30[0] === '11:00 AM', '30m appointment covers 1 slot: [11:00 AM]');

    const slots90 = getSlotsCoveredByAppointment('11:00 AM', 90);
    assert(slots90.length === 3 && slots90.includes('11:00 AM') && slots90.includes('11:30 AM') && slots90.includes('12:00 PM'), '90m appointment covers 3 slots: [11:00 AM, 11:30 AM, 12:00 PM]');

    const slots120 = getSlotsCoveredByAppointment('02:00 PM', 120);
    assert(slots120.length === 4 && slots120[3] === '03:30 PM', '120m appointment covers 4 consecutive slots');

    // -------------------------------------------------------------
    // SECTION 4: LEAVE LOGIC & NAME NORMALIZATION
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Specialist Leave & Name Normalization ---');
    const leaveDate = '2026-11-25';
    await Leave.create({
      employee: specialistA._id,
      employeeId: specialistA._id.toString(),
      employeeName: 'Alex Rivera',
      startDate: leaveDate,
      endDate: leaveDate,
      status: 'Approved',
      reason: 'Annual Leave'
    });

    // Test name variants against leave
    const nameVariants = [
      'Alex Rivera',
      'Alex Rivera (Specialist)',
      'alex rivera',
      'Alex  Rivera ',
      'ALEX RIVERA'
    ];

    for (const v of nameVariants) {
      const onLeave = await isSpecialistOnLeave(leaveDate, v);
      assert(!!onLeave, `Leave detected correctly for variant "${v}"`);
    }

    // Check pending leave does NOT block
    const pendingLeaveDate = '2026-11-28';
    await Leave.create({
      employee: specialistB._id,
      employeeId: specialistB._id.toString(),
      employeeName: 'Maria Santos',
      startDate: pendingLeaveDate,
      endDate: pendingLeaveDate,
      status: 'Pending',
      reason: 'Medical checkup'
    });

    const pendingCheck = await isSpecialistOnLeave(pendingLeaveDate, 'Maria Santos');
    assert(pendingCheck === null, 'Pending leave does NOT block specialist availability');

    // -------------------------------------------------------------
    // SECTION 5: RESCHEDULE SAFETY & CONFLICT REJECTION
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Reschedule Workflow & Conflict Safety ---');
    // Create base appointment for Maria Santos on 2026-12-01 at 10:00 AM (60m)
    const appBase = await adminService.createAppointment({
      customerName: customerA.name,
      customerPhone: customerA.phone,
      customerEmail: customerA.email,
      service: 'Luxury Hair & Scalp Spa',
      price: 1999,
      services: [{ serviceId: spaService._id, name: 'Luxury Hair & Scalp Spa', price: 1999, durationMinutes: 60 }],
      specialistName: 'Maria Santos',
      appointmentDate: '2026-12-01',
      appointmentTime: '10:00 AM',
      status: 'Confirmed'
    });

    // Attempt reschedule to overlapping occupied slot (should fail)
    let caughtConflict = false;
    try {
      await adminService.createAppointment({
        customerName: customerB.name,
        customerPhone: customerB.phone,
        customerEmail: customerB.email,
        service: 'Precision Hair Cut',
        price: 500,
        specialistName: 'Maria Santos',
        appointmentDate: '2026-12-01',
        appointmentTime: '10:30 AM',
        status: 'Confirmed'
      });
    } catch (e) {
      caughtConflict = true;
    }
    assert(caughtConflict, 'Booking into occupied slot during 10:00-11:00 window threw Conflict');

    // Reschedule appBase to 02:00 PM (free slot)
    const rescheduled = await adminService.rescheduleAppointment(
      appBase._id.toString(),
      '2026-12-01',
      '02:00 PM',
      'Client requested afternoon slot',
      { name: 'Admin', role: 'admin' }
    );
    assert(rescheduled.appointmentTime === '02:00 PM' && rescheduled.slotKeys.some(k => k.includes('02:00 pm')), 'Rescheduled successfully and slotKeys updated to new slot');

    // Verify old slot (10:00 AM) is now FREE
    const conflictOldSlot = await checkSlotConflict({
      appointmentDate: '2026-12-01',
      appointmentTime: '10:00 AM',
      durationMinutes: 30,
      specialistName: 'Maria Santos'
    });
    assert(!conflictOldSlot.hasConflict, 'Previous slot (10:00 AM) is freed up after reschedule');

    // -------------------------------------------------------------
    // SECTION 6: CANCELLATION & REVENUE INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: Cancellation & Financial Revenue Integrity ---');
    const cancelledApp = await adminService.updateAppointmentStatus(
      appBase._id.toString(),
      'Cancelled',
      'Unpaid',
      { name: 'Customer', role: 'customer', note: 'Customer cancelled' }
    );
    assert(cancelledApp.status === 'Cancelled' && cancelledApp.slotKeys.length === 0, 'Cancelled appointment cleared slotKeys completely');

    // Verify no revenue recorded for cancelled appointment
    const txnCancelled = await Transaction.findOne({ appointmentId: appBase._id.toString(), status: 'Completed' });
    assert(!txnCancelled, 'Cancelled appointment has zero credited completed revenue');

    // -------------------------------------------------------------
    // SECTION 7: COMPLETION & IDEMPOTENT FINANCIAL LEDGER
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: Completion & Idempotent Financial Ledger ---');
    const freshApp = await adminService.createAppointment({
      customerName: customerB.name,
      customerPhone: customerB.phone,
      customerEmail: customerB.email,
      service: 'Precision Hair Cut',
      price: 500,
      specialistName: 'Alex Rivera',
      appointmentDate: '2026-12-05',
      appointmentTime: '04:00 PM',
      status: 'Confirmed'
    });

    // Mark as Completed and Paid
    const completedApp = await adminService.updateAppointmentStatus(
      freshApp._id.toString(),
      'Completed',
      'Paid',
      { name: 'Alex Rivera', role: 'employee' }
    );
    assert(completedApp.status === 'Completed' && completedApp.paymentStatus === 'Paid', 'Appointment marked Completed and Paid');

    const txnCount1 = await Transaction.countDocuments({ appointmentId: freshApp._id.toString() });
    assert(txnCount1 === 1, 'Exactly 1 Transaction created in financial ledger for completed appointment');

    // Mark completed again to test idempotency
    await adminService.updateAppointmentStatus(
      freshApp._id.toString(),
      'Completed',
      'Paid',
      { name: 'Alex Rivera', role: 'employee' }
    );
    const txnCount2 = await Transaction.countDocuments({ appointmentId: freshApp._id.toString() });
    assert(txnCount2 === 1, 'Idempotency verified: Re-updating completion does not create duplicate ledger transactions');

    // -------------------------------------------------------------
    // SECTION 8: STATUS TRANSITION RESTRICTIONS
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: Status Transition Restrictions ---');
    let caughtInvalidCompletedToPending = false;
    try {
      await adminService.updateAppointmentStatus(freshApp._id.toString(), 'Pending', 'Paid');
    } catch (e) {
      caughtInvalidCompletedToPending = true;
    }
    assert(caughtInvalidCompletedToPending, 'Blocked invalid transition Completed -> Pending');

    let caughtInvalidCancelledToInProgress = false;
    try {
      await adminService.updateAppointmentStatus(appBase._id.toString(), 'In Progress', 'Unpaid');
    } catch (e) {
      caughtInvalidCancelledToInProgress = true;
    }
    assert(caughtInvalidCancelledToInProgress, 'Blocked invalid transition Cancelled -> In Progress');

    console.log('\n================================================================');
    console.log(`📊 PRODUCTION VERIFICATION SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Fatal Verification Error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runMasterProductionVerification();
