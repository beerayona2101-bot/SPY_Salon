const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Employee = require('../src/models/Employee');
const Appointment = require('../src/models/Appointment');
const { checkSlotConflict } = require('../src/utils/appointmentHelper');

async function testConcurrency() {
  console.log('--- TESTING REAL-WORLD CONCURRENCY RACE CONDITION ---');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  try {
    const specialist = await Employee.create({
      empCode: 'EMP-2001',
      name: 'Alex Rivera',
      email: 'alex.rivera@spysalon.com',
      phone: '+91 98765 11111',
      status: 'Active'
    });

    const date = '2026-11-20';
    const time = '10:00 AM';

    async function bookCustomer(customerName) {
      // Current pattern: Check then insert
      const conflict = await checkSlotConflict({
        appointmentDate: date,
        appointmentTime: time,
        durationMinutes: 60,
        specialistName: 'Alex Rivera'
      });

      if (conflict.hasConflict) {
        throw new Error(`Conflict: ${conflict.reason}`);
      }

      // Simulate tiny network/disk I/O jitter between check and create
      await new Promise(r => setTimeout(r, 10));

      const app = await Appointment.create({
        bookingId: 'SPY-' + Math.floor(100000 + Math.random() * 900000),
        customerName,
        customerPhone: '+919999999999',
        branch: 'Jubilee Hills',
        service: 'Hair Cut',
        totalDuration: 60,
        specialistName: 'Alex Rivera (Specialist)',
        appointmentDate: date,
        appointmentTime: time,
        status: 'Confirmed'
      });
      return app;
    }

    console.log('Sending Customer A and Customer B simultaneously...');
    const results = await Promise.allSettled([
      bookCustomer('Customer A'),
      bookCustomer('Customer B')
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    console.log(`Successes: ${successes.length}, Failures: ${failures.length}`);
    const appCount = await Appointment.countDocuments({ appointmentDate: date });
    console.log(`Total appointments in DB for date: ${appCount}`);

    if (appCount > 1) {
      console.log('🔴 RESULT: CHECK-THEN-INSERT RACE CONDITION CONFIRMED! Multiple appointments created for same slot!');
    } else {
      console.log('🟢 RESULT: Race condition avoided.');
    }

  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
}

testConcurrency();
