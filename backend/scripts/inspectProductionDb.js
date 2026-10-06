const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../src/models/Appointment');
const { cleanSpecialistName, generateSlotKeys } = require('../src/utils/appointmentHelper');

async function inspectProductionDb() {
  console.log('====================================================');
  console.log('🔍 INSPECTING PRODUCTION MONGODB FOR SPY SALON');
  console.log('====================================================');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set in backend/.env');
    return;
  }

  console.log(`Connecting to: ${mongoUri.split('@')[1] || 'MongoDB'}...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB Atlas successfully!\n');

    // 1. Sync indexes so MongoDB builds any new declared indexes
    console.log('Ensuring all schema indexes in collection...');
    await Appointment.syncIndexes();

    // 2. Fetch all raw indexes from MongoDB collection
    const indexes = await Appointment.collection.indexes();
    console.log('\n--- Current MongoDB Indexes on "appointments" collection ---');
    console.log(JSON.stringify(indexes, null, 2));

    const slotKeysIndex = indexes.find(idx => idx.key && idx.key.slotKeys);
    if (slotKeysIndex) {
      console.log('\n✅ VERIFIED: slotKeys unique partial index exists in production MongoDB:');
      console.log('   Index Name:', slotKeysIndex.name);
      console.log('   Unique:', slotKeysIndex.unique);
      console.log('   PartialFilterExpression:', JSON.stringify(slotKeysIndex.partialFilterExpression));
    } else {
      console.log('\n❌ slotKeys index NOT FOUND in database!');
    }

    // 3. Inspect existing appointments
    const totalApps = await Appointment.countDocuments();
    console.log(`\nTotal appointments in database: ${totalApps}`);

    const activeFilter = {
      status: { $in: ['Pending', 'Confirmed', 'Staff_Accepted', 'In Progress', 'Rescheduled', 'Reschedule Requested'] }
    };
    const totalActive = await Appointment.countDocuments(activeFilter);
    console.log(`Active appointments in database: ${totalActive}`);

    const activeWithoutKeys = await Appointment.find({
      ...activeFilter,
      $or: [
        { slotKeys: { $exists: false } },
        { slotKeys: { $size: 0 } }
      ]
    });

    console.log(`Active appointments missing slotKeys: ${activeWithoutKeys.length}`);
    if (activeWithoutKeys.length > 0) {
      console.log('\nList of active appointments needing slotKeys population:');
      for (const app of activeWithoutKeys) {
        console.log(` - ID: ${app._id}, BookingId: #${app.bookingId}, Specialist: ${app.specialistName}, Date: ${app.appointmentDate}, Time: ${app.appointmentTime}, Duration: ${app.totalDuration || 30}m`);
      }

      // Automatically populate missing slotKeys safely for active appointments
      console.log('\nSafely backfilling missing slotKeys for active appointments...');
      let backfilled = 0;
      for (const app of activeWithoutKeys) {
        const dur = app.totalDuration || (Array.isArray(app.services) && app.services.length > 0 ? app.services.reduce((s, x) => s + (x.durationMinutes || 30), 0) : 30);
        const keys = generateSlotKeys(app.specialistName, app.appointmentDate, app.appointmentTime, dur);
        if (keys.length > 0) {
          await Appointment.updateOne({ _id: app._id }, { $set: { slotKeys: keys, totalDuration: dur } });
          backfilled++;
        }
      }
      console.log(`✅ Successfully backfilled slotKeys for ${backfilled} active appointments!`);
    } else {
      console.log('✅ All active appointments in the database have valid slotKeys!');
    }

  } catch (err) {
    console.error('❌ MongoDB Inspection Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

inspectProductionDb();
