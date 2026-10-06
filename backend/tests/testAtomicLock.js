const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { cleanSpecialistName, getSlotsCoveredByAppointment } = require('../src/utils/appointmentHelper');

async function testAtomicLock() {
  console.log('--- TESTING ATOMIC SLOT LOCK WITH UNIQUE INDEX ---');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  try {
    const testSchema = new mongoose.Schema({
      bookingId: { type: String, required: true, unique: true },
      customerName: String,
      specialistName: String,
      appointmentDate: String,
      appointmentTime: String,
      totalDuration: { type: Number, default: 30 },
      status: { type: String, default: 'Confirmed' },
      slotKeys: [{ type: String }]
    });

    testSchema.index(
      { slotKeys: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { 
          status: { $in: ['Pending', 'Confirmed', 'Staff_Accepted', 'In Progress', 'Completed', 'Rescheduled', 'Reschedule Requested'] }
        } 
      }
    );

    const TestAppointment = mongoose.model('TestAppointment', testSchema);
    await TestAppointment.init(); // ensure indexes built

    function generateSlotKeys(specName, date, time, duration) {
      const clean = cleanSpecialistName(specName).toLowerCase();
      if (!clean || clean === 'any available specialist') return [];
      const slots = getSlotsCoveredByAppointment(time, duration);
      return slots.map(s => `${clean}#${date}#${s.toLowerCase()}`);
    }

    const date = '2026-11-20';
    const time = '10:00 AM';

    async function bookCustomer(customerName, startTime, duration) {
      const keys = generateSlotKeys('Alex Rivera', date, startTime, duration);
      
      try {
        const app = await TestAppointment.create({
          bookingId: 'SPY-' + Math.floor(100000 + Math.random() * 900000),
          customerName,
          specialistName: 'Alex Rivera (Specialist)',
          appointmentDate: date,
          appointmentTime: startTime,
          totalDuration: duration,
          status: 'Confirmed',
          slotKeys: keys
        });
        return { success: true, app };
      } catch (err) {
        if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
          return { success: false, conflict: true, error: '409 Conflict: Slot already taken' };
        }
        throw err;
      }
    }

    console.log('Test 1: Simultaneous booking of same slot (10:00 AM, 60m)...');
    const [resA, resB] = await Promise.all([
      bookCustomer('Customer A', '10:00 AM', 60),
      bookCustomer('Customer B', '10:00 AM', 60)
    ]);

    console.log('Customer A:', resA.success ? 'SUCCESS' : resA.error);
    console.log('Customer B:', resB.success ? 'SUCCESS' : resB.error);

    const count = await TestAppointment.countDocuments({ appointmentDate: date });
    console.log(`Appointments created in DB: ${count}`);

    if (count === 1 && (resA.success !== resB.success)) {
      console.log('✅ PASS: Atomic double-booking prevention verified under real concurrent load!');
    } else {
      console.error('❌ FAIL: Concurrency issue still exists!');
    }

    console.log('\nTest 2: Simultaneous overlapping booking (10:00-11:00 vs 10:30-11:30)...');
    await TestAppointment.deleteMany({});

    const [res1, res2] = await Promise.all([
      bookCustomer('Customer 1', '10:00 AM', 60), // covers 10:00 and 10:30
      bookCustomer('Customer 2', '10:30 AM', 60)  // covers 10:30 and 11:00
    ]);

    console.log('Customer 1 (10:00-11:00):', res1.success ? 'SUCCESS' : res1.error);
    console.log('Customer 2 (10:30-11:30):', res2.success ? 'SUCCESS' : res2.error);

    const countOverlap = await TestAppointment.countDocuments({ appointmentDate: date });
    console.log(`Appointments created in DB for overlap test: ${countOverlap}`);

    if (countOverlap === 1 && (res1.success !== res2.success)) {
      console.log('✅ PASS: Atomic overlapping interval prevention verified under real concurrent load!');
    } else {
      console.error('❌ FAIL: Overlapping concurrency issue still exists!');
    }

  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
}

testAtomicLock();
