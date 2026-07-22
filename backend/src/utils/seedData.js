const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spy_salon';
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Seed Script] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Seed Script] Remote MongoDB failed (${error.message}). Trying local MongoDB...`);
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/spy_salon', { serverSelectionTimeoutMS: 3000 });
      console.log(`[Seed Script] Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.warn(`[Seed Script] Could not connect to MongoDB. (Offline/Demo Mode)`);
    }
  }
};

const seedAdminUser = async () => {
  await connectDB();

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@spysalon.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminPhone = process.env.ADMIN_PHONE || '+18005550199';

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      console.log(`[Seed Script] Admin user (${adminEmail}) already exists. Skipping creation.`);
    } else {
      const admin = await User.create({
        name: 'System Administrator',
        email: adminEmail.toLowerCase(),
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        isVerified: true
      });
      console.log(`[Seed Script] Default Admin Created Successfully! Email: ${admin.email}`);
    }

    mongoose.disconnect();
    console.log('[Seed Script] Database disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Script] Seeding Error: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedAdminUser();
