const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../src/models/Appointment');
const { cleanSpecialistName, generateSlotKeys } = require('../src/utils/appointmentHelper');

async function testIndexFilter() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to Atlas.');

  // 1. Backfill slotKeys for all active appointments in DB first
  const activeApps = await Appointment.find({
    status: { $in: ['Pending', 'Confirmed', 'Staff_Accepted', 'In Progress', 'Rescheduled', 'Reschedule Requested'] }
  });
  console.log(`Found ${activeApps.length} active appointments in Atlas.`);

  for (const app of activeApps) {
    if (!app.slotKeys || app.slotKeys.length === 0) {
      const dur = app.totalDuration || (Array.isArray(app.services) && app.services.length > 0 ? app.services.reduce((s, x) => s + (x.durationMinutes || 30), 0) : 30);
      const keys = generateSlotKeys(app.specialistName, app.appointmentDate, app.appointmentTime, dur);
      if (keys.length > 0) {
        await Appointment.updateOne({ _id: app._id }, { $set: { slotKeys: keys, totalDuration: dur } });
      }
    }
  }

  // 2. Drop old slotKeys index if half-created
  try {
    await Appointment.collection.dropIndex('slotKeys_1');
    console.log('Dropped old slotKeys index.');
  } catch (e) {
    console.log('No old index to drop:', e.message);
  }

  // 3. Create partial unique index with slotKeys: { $type: "string" }
  try {
    await Appointment.collection.createIndex(
      { slotKeys: 1 },
      {
        unique: true,
        partialFilterExpression: {
          status: { $in: ['Pending', 'Confirmed', 'Staff_Accepted', 'In Progress', 'Completed', 'Rescheduled', 'Reschedule Requested'] },
          slotKeys: { $type: 'string' }
        }
      }
    );
    console.log('✅ SUCCESS! Unique partial index slotKeys_1 created successfully in MongoDB Atlas!');
  } catch (e) {
    console.error('❌ Failed to create index:', e.message);
  }

  const indexes = await Appointment.collection.indexes();
  console.log('\nAll current Atlas indexes on appointments:');
  console.log(JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

testIndexFilter();
