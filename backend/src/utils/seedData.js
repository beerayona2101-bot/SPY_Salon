const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
  override: true
});

const User = require('../models/User');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('[Seed Script] MONGO_URI environment variable not set. Skipping seed script execution.');
      return false;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(
      `[Seed Script] MongoDB Connected: ${conn.connection.host}`
    );

    return true;
  } catch (error) {
    console.error(
      `[Seed Script] MongoDB connection failed: ${error.message}`
    );

    return false;
  }
};

/**
 * Create or update only the Admin user.
 *
 * No dummy/demo data is created.
 */
const runSeeder = async (isCalledFromApp = true) => {
  const connected = await connectDB();

  if (!connected) {
    if (!isCalledFromApp) {
      process.exit(1);
    }

    return false;
  }

  try {
    // ============================================
    // ADMIN CONFIGURATION
    // ============================================

    const adminEmail = (
      process.env.ADMIN_EMAIL || 'admin@spysalon.com'
    ).trim().toLowerCase();

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.log('[Seed] ADMIN_PASSWORD environment variable not set. Skipping default admin seed setup.');
      return;
    }

    const adminPhone =
      process.env.ADMIN_PHONE || '+91 98765 00000';

    // ============================================
    // FIND EXISTING ADMIN
    // ============================================

    let admin = await User.findOne({
      email: adminEmail
    });

    // ============================================
    // CREATE ADMIN IF NOT EXISTS
    // ============================================

    if (!admin) {
      admin = await User.create({
        name: 'Executive Administrator',
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        isVerified: true
      });

      console.log(
        `[Seed] Admin account created: ${adminEmail}`
      );
    } else {
      // ============================================
      // UPDATE EXISTING ADMIN
      // ============================================

      admin.password = adminPassword;
      admin.phone = adminPhone;
      admin.role = 'admin';
      admin.isVerified = true;

      await admin.save();

      console.log(
        `[Seed] Admin account updated successfully: ${adminEmail}`
      );
    }

    // ============================================
    // NO DUMMY DATA
    // ============================================

    console.log('');
    console.log('==============================================');
    console.log('  DATABASE SEED COMPLETED');
    console.log('==============================================');
    console.log('  Admin:        Created/Updated');
    console.log('  Branches:     Not seeded');
    console.log('  Services:     Not seeded');
    console.log('  Memberships:  Not seeded');
    console.log('  Employees:     Not seeded');
    console.log('  Customers:     Not seeded');
    console.log('  Appointments:  Not seeded');
    console.log('  Attendance:    Not seeded');
    console.log('  Leaves:        Not seeded');
    console.log('  Reviews:       Not seeded');
    console.log('  Notifications: Not seeded');
    console.log('  Transactions:  Not seeded');
    console.log('  Activity Logs: Not seeded');
    console.log('  Enquiries:     Not seeded');
    console.log('==============================================');
    console.log('');

    if (!isCalledFromApp) {
      await mongoose.disconnect();
      console.log(
        '[Seed Script] Database disconnected cleanly.'
      );

      process.exit(0);
    }

    return true;
  } catch (error) {
    console.error(
      `[Seed Script] Seeding Error: ${error.message}`
    );

    if (!isCalledFromApp) {
      await mongoose.disconnect();
      process.exit(1);
    }

    return false;
  }
};

// ============================================
// RUN DIRECTLY
// ============================================

if (require.main === module) {
  runSeeder(false);
}

// ============================================
// EXPORT
// ============================================

module.exports = (isCalledFromApp = true) =>
  runSeeder(isCalledFromApp);