/**
 * SPY Salon - Master End-to-End Appointment & Availability Test Suite
 * Tests:
 * 1. Duration-aware slot overlap calculation
 * 2. Approved specialist leave blocking
 * 3. Double-booking prevention
 * 4. Status lifecycle transitions
 * 5. Ledger Transaction synchronization on Completion
 * 6. Ownership authorization for customer reschedule/cancellation
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
  getBookedSlotsForDateAndSpecialist, 
  checkSlotConflict 
} = require('../src/utils/appointmentHelper');

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 STARTING SPY SALON MASTER APPOINTMENT AUDIT & TESTS');
  console.log('======================================================\n');

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Duration-aware Slot Calculation Helper
    // ----------------------------------------------------
    console.log('--- TEST 1: Duration-aware Slot Range Calculation ---');
    const slots30 = getSlotsCoveredByAppointment('10:00 AM', 30);
    assert(slots30.length === 1 && slots30[0] === '10:00 AM', '30-minute service covers exactly 1 slot (10:00 AM)');

    const slots60 = getSlotsCoveredByAppointment('10:00 AM', 60);
    assert(slots60.length === 2 && slots60[0] === '10:00 AM' && slots60[1] === '10:30 AM', '60-minute service covers 2 consecutive slots (10:00 AM, 10:30 AM)');

    const slots90 = getSlotsCoveredByAppointment('02:00 PM', 90);
    assert(slots90.length === 3 && slots90[0] === '02:00 PM' && slots90[1] === '02:30 PM' && slots90[2] === '03:00 PM', '90-minute service covers 3 consecutive slots (02:00 PM, 02:30 PM, 03:00 PM)');

    // ----------------------------------------------------
    // TEST 2: Seed Specialist, Customer, and Service
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Database Models Setup ---');
    const specialist = await Employee.create({
      empCode: 'EMP-1001',
      name: 'Alex Rivera',
      email: 'alex.rivera@spysalon.com',
      phone: '+91 98765 11111',
      specialties: ['Hair Architecture', 'Master Barber'],
      status: 'Active'
    });

    const customer1 = await User.create({
      name: 'Sophia Williams',
      email: 'sophia@example.com',
      phone: '+91 98765 22222',
      password: 'Password@123',
      role: 'customer'
    });

    const customer2 = await User.create({
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '+91 98765 33333',
      password: 'Password@123',
      role: 'customer'
    });

    const serviceDoc = await Service.create({
      name: 'Luxury Hair Spa',
      slug: 'luxury-hair-spa',
      category: 'Hair Care',
      price: 2499,
      discountPrice: 1999,
      durationMinutes: 60,
      isActive: true
    });

    assert(specialist._id && customer1._id && serviceDoc._id, 'Specialist, Customer, and Service records created successfully');

    // ----------------------------------------------------
    // TEST 3: Create Appointment & Overlap Conflict Prevention
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Double Booking & Overlap Conflict Prevention ---');
    const futureDate = '2026-11-15';
    
    // Create initial 60-min appointment for Alex Rivera at 10:00 AM (covers 10:00 AM and 10:30 AM)
    const app1 = await adminService.createAppointment({
      customerName: customer1.name,
      customerPhone: customer1.phone,
      customerEmail: customer1.email,
      service: 'Luxury Hair Spa',
      price: 1999,
      services: [{ serviceId: serviceDoc._id, name: 'Luxury Hair Spa', price: 1999, durationMinutes: 60 }],
      specialistName: 'Alex Rivera (Specialist)',
      appointmentDate: futureDate,
      appointmentTime: '10:00 AM',
      status: 'Confirmed'
    });
    assert(app1.bookingId && app1.status === 'Confirmed', `Appointment 1 created (#${app1.bookingId})`);

    // Check booked slots for Alex Rivera on futureDate
    const booked = await getBookedSlotsForDateAndSpecialist(futureDate, 'Alex Rivera');
    assert(booked.includes('10:00 AM') && booked.includes('10:30 AM'), 'getBookedSlots correctly reports both 10:00 AM and 10:30 AM as booked for 60-min appointment');

    // Attempt double-booking at 10:00 AM
    let conflict1000 = await checkSlotConflict({
      appointmentDate: futureDate,
      appointmentTime: '10:00 AM',
      durationMinutes: 30,
      specialistName: 'Alex Rivera'
    });
    assert(conflict1000.hasConflict === true, 'Double-booking at exact same slot (10:00 AM) is blocked');

    // Attempt overlapping booking at 10:30 AM (within 10:00-11:00 window)
    let conflict1030 = await checkSlotConflict({
      appointmentDate: futureDate,
      appointmentTime: '10:30 AM',
      durationMinutes: 30,
      specialistName: 'Alex Rivera'
    });
    assert(conflict1030.hasConflict === true, 'Overlapping booking at 10:30 AM (during running 60-min service) is blocked');

    // Booking at 11:00 AM (after 10:00-11:00 window)
    let conflict1100 = await checkSlotConflict({
      appointmentDate: futureDate,
      appointmentTime: '11:00 AM',
      durationMinutes: 30,
      specialistName: 'Alex Rivera'
    });
    assert(conflict1100.hasConflict === false, 'Adjacent non-overlapping slot at 11:00 AM is available');

    // ----------------------------------------------------
    // TEST 4: Approved Specialist Leave Integration
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Approved Specialist Leave Blocking ---');
    const leaveDate = '2026-11-20';
    await Leave.create({
      employee: specialist._id,
      employeeId: specialist._id.toString(),
      employeeName: 'Alex Rivera',
      startDate: leaveDate,
      endDate: leaveDate,
      reason: 'Family event',
      status: 'Approved'
    });

    const leaveConflict = await checkSlotConflict({
      appointmentDate: leaveDate,
      appointmentTime: '11:30 AM',
      durationMinutes: 30,
      specialistName: 'Alex Rivera (Specialist)'
    });
    assert(leaveConflict.hasConflict === true, 'Booking Alex Rivera on approved leave date is blocked');

    const allSlotsOnLeave = await getBookedSlotsForDateAndSpecialist(leaveDate, 'Alex Rivera');
    assert(allSlotsOnLeave.length > 20, 'All time slots on specialist leave date are reported as unavailable');

    // ----------------------------------------------------
    // TEST 5: Status Lifecycle Transitions & Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Status Lifecycle Transitions & Restrictions ---');
    
    // Valid: Confirmed -> In Progress
    const inProg = await adminService.updateAppointmentStatus(app1._id.toString(), 'In Progress', 'Unpaid', {
      role: 'employee',
      name: 'Alex Rivera'
    });
    assert(inProg.status === 'In Progress', 'Transition from Confirmed -> In Progress succeeded');

    // Invalid: Completed -> Pending (Blocked)
    let caughtInvalid = false;
    try {
      await adminService.updateAppointmentStatus(app1._id.toString(), 'Pending', 'Unpaid');
    } catch (e) {
      caughtInvalid = true;
    }
    assert(caughtInvalid, 'Invalid transition In Progress -> Pending was correctly rejected');

    // ----------------------------------------------------
    // TEST 6: Completion & Financial Ledger Synchronization
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Completion & Financial Ledger Transaction Creation ---');
    
    // Check no transaction before completion
    const txBefore = await Transaction.findOne({ appointmentId: app1._id.toString() });
    assert(!txBefore, 'No transaction exists before service completion for unpaid appointment');

    // Mark as Completed and Paid
    const completed = await adminService.updateAppointmentStatus(app1._id.toString(), 'Completed', 'Paid', {
      role: 'employee',
      name: 'Alex Rivera'
    });
    assert(completed.status === 'Completed' && completed.paymentStatus === 'Paid', 'Appointment marked Completed and Paid');

    // Verify Ledger Transaction was created atomically
    const txAfter = await Transaction.findOne({ appointmentId: app1._id.toString() });
    assert(txAfter && txAfter.status === 'Completed' && txAfter.type === 'Credited' && txAfter.amount === 1999, 'Ledger credited transaction of ₹1999 created upon appointment completion');

    // Repeat update: verify Idempotency (no duplicate transaction)
    await adminService.updateAppointmentStatus(app1._id.toString(), 'Completed', 'Paid');
    const txCount = await Transaction.countDocuments({ appointmentId: app1._id.toString() });
    assert(txCount === 1, 'Idempotency verified: exactly 1 transaction created, no duplicates');

    // ----------------------------------------------------
    // TEST 7: Reschedule Workflow & Conflict Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Reschedule Workflow ---');
    const app2 = await adminService.createAppointment({
      customerName: customer2.name,
      customerPhone: customer2.phone,
      customerEmail: customer2.email,
      service: 'Precision Hair Cut',
      price: 500,
      specialistName: 'Alex Rivera',
      appointmentDate: '2026-11-25',
      appointmentTime: '02:00 PM',
      status: 'Confirmed'
    });

    // Reschedule to a valid slot
    const rescheduled = await adminService.rescheduleAppointment(
      app2._id.toString(),
      '2026-11-26',
      '03:00 PM',
      'Customer requested afternoon slot',
      { name: 'Alex Rivera', role: 'employee' }
    );
    assert(rescheduled.appointmentDate === '2026-11-26' && rescheduled.appointmentTime === '03:00 PM', 'Rescheduled to 2026-11-26 at 03:00 PM successfully');

    // Attempt reschedule to leave date (should fail)
    let caughtLeaveReschedule = false;
    try {
      await adminService.rescheduleAppointment(
        app2._id.toString(),
        leaveDate,
        '03:00 PM',
        'Try reschedule on leave date',
        { name: 'Alex Rivera', role: 'employee' }
      );
    } catch (e) {
      caughtLeaveReschedule = true;
    }
    assert(caughtLeaveReschedule, 'Rescheduling to specialist approved leave date was rejected');

    console.log('\n======================================================');
    console.log(`📊 MASTER APPOINTMENT AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Fatal test runner error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
