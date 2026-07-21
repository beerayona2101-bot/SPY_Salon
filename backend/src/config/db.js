const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // Fallback gracefully so server runs even if remote DB connection is unreachable
  }
};

module.exports = connectDB;
