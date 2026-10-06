const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../src/models/Appointment');
const adminService = require('../src/services/adminService');
const { checkSlotConflict } = require('../src/utils/appointmentHelper');

function isActiveQueueAppointment(raw) {
  if (!raw) return false;
  const status = String(raw.status || '').trim().toLowerCase();
  return status !== 'completed' &&
         status !== 'cancelled' &&
         status !== 'staff_rejected' &&
         status !== 'no show' &&
         status !== 'no_show' &&
         status !== 'noshow';
}

async function verifyReschedule() {
  console.log('====================================================');
  console.log('🔍 SPY SALON RESCHEDULE LIFECYCLE DEEP VERIFICATION');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  const testDate = '2026-12-28';
  // Clean up any prior test records for this test date
  await Appointment.deleteMany({ appointmentDate: testDate });

  try {
    // -----------------------------------------------------------------
    // STEP 1: Create initial appointment
    // -----------------------------------------------------------------
    console.log('--- STEP 1: Creating Initial Appointment at 10:00 AM ---');
    const initialApp = await adminService.createAppointment({
      customerName: 'Reschedule Test Client',
      customerPhone: '+91 98765 77777',
      customerEmail: 'reschedule_test@spysalon.com',
      service: 'Hair Architecture & Cut',
      services: [{ name: 'Hair Architecture & Cut', price: 800, durationMinutes: 30 }],
      specialistName: 'Alex Rivera',
      appointmentDate: testDate,
      appointmentTime: '10:00 AM',
      status: 'Confirmed'
    });

    console.log(`Original Appointment Created:`);
    console.log(`  _id: ${initialApp._id}`);
    console.log(`  bookingId: #${initialApp.bookingId}`);
    console.log(`  status: ${initialApp.status}`);
    console.log(`  date: ${initialApp.appointmentDate}`);
    console.log(`  time: ${initialApp.appointmentTime}`);
    console.log(`  slotKeys: ${JSON.stringify(initialApp.slotKeys)}`);

    const countBeforeReschedule = await Appointment.countDocuments({ customerEmail: 'reschedule_test@spysalon.com' });
    console.log(`\nTotal DB documents for client: ${countBeforeReschedule}`);

    // -----------------------------------------------------------------
    // STEP 2: Reschedule to 02:00 PM
    // -----------------------------------------------------------------
    console.log('\n--- STEP 2: Rescheduling to 02:00 PM ---');
    const rescheduledApp = await adminService.rescheduleAppointment(
      initialApp._id.toString(),
      testDate,
      '02:00 PM',
      'Client requested afternoon slot',
      { name: 'Admin', role: 'admin' }
    );

    console.log(`Rescheduled Appointment State:`);
    console.log(`  _id: ${rescheduledApp._id}`);
    console.log(`  bookingId: #${rescheduledApp.bookingId}`);
    console.log(`  status: ${rescheduledApp.status}`);
    console.log(`  date: ${rescheduledApp.appointmentDate}`);
    console.log(`  time: ${rescheduledApp.appointmentTime}`);
    console.log(`  slotKeys: ${JSON.stringify(rescheduledApp.slotKeys)}`);

    const countAfterReschedule = await Appointment.countDocuments({ customerEmail: 'reschedule_test@spysalon.com' });
    console.log(`\nTotal DB documents for client after reschedule: ${countAfterReschedule}`);

    // -----------------------------------------------------------------
    // STEP 3: Queue Count & List Membership Check
    // -----------------------------------------------------------------
    const allClientApps = await Appointment.find({ customerEmail: 'reschedule_test@spysalon.com' });
    const activeQueueItems = allClientApps.filter(isActiveQueueAppointment);

    console.log(`\n--- STEP 3: Service Queue Workload Calculation ---`);
    console.log(`Service Queue Count for this client: ${activeQueueItems.length}`);
    console.log(`Service Queue List Count: ${activeQueueItems.length}`);
    console.log(`Is same document updated in-place?: ${initialApp._id.toString() === rescheduledApp._id.toString()}`);
    console.log(`Did document count remain exactly 1?: ${countAfterReschedule === 1}`);

    // Verify 10:00 AM slot is free
    const checkOld = await checkSlotConflict({ appointmentDate: testDate, appointmentTime: '10:00 AM', durationMinutes: 30, specialistName: 'Alex Rivera' });
    console.log(`Old 10:00 AM slot free?: ${!checkOld.hasConflict}`);

    // Verify 02:00 PM slot is occupied
    const checkNew = await checkSlotConflict({ appointmentDate: testDate, appointmentTime: '02:00 PM', durationMinutes: 30, specialistName: 'Alex Rivera' });
    console.log(`New 02:00 PM slot occupied?: ${checkNew.hasConflict}`);

    // -----------------------------------------------------------------
    // STEP 4: Failed Reschedule Attempt into Occupied Slot
    // -----------------------------------------------------------------
    console.log('\n--- STEP 4: Failed Reschedule Attempt (Occupied Conflict) ---');
    // Create another appointment at 04:00 PM
    const app4pm = await adminService.createAppointment({
      customerName: 'Client 4PM',
      customerPhone: '+91 98765 44444',
      service: 'Beard Trim',
      services: [{ name: 'Beard Trim', price: 400, durationMinutes: 30 }],
      specialistName: 'Alex Rivera',
      appointmentDate: testDate,
      appointmentTime: '04:00 PM',
      status: 'Confirmed'
    });

    let failedRescheduleThrown = false;
    try {
      await adminService.rescheduleAppointment(
        rescheduledApp._id.toString(),
        testDate,
        '04:00 PM',
        'Attempt clash with 4PM client',
        { name: 'Admin', role: 'admin' }
      );
    } catch (e) {
      failedRescheduleThrown = true;
      console.log(`Expected Conflict Caught: "${e.message}"`);
    }

    const appAfterFailedReschedule = await Appointment.findById(rescheduledApp._id);
    console.log(`\nState of Appointment after FAILED Reschedule:`);
    console.log(`  time remained: ${appAfterFailedReschedule.appointmentTime}`);
    console.log(`  slotKeys remained: ${JSON.stringify(appAfterFailedReschedule.slotKeys)}`);
    console.log(`  status remained: ${appAfterFailedReschedule.status}`);
    console.log(`  No duplicate created?: ${countAfterReschedule === 1}`);

    // Clean up
    await Appointment.deleteMany({ appointmentDate: testDate });

  } finally {
    await mongoose.disconnect();
  }
}

verifyReschedule();
