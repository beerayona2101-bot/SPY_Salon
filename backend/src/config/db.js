const mongoose = require('mongoose');

// Globally disable command buffering so queries fail fast or fallback when DB is disconnected
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Remote Connection Failed]: ${error.message}. Trying local fallback...`);
    try {
      const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/spy_salon', { serverSelectionTimeoutMS: 2000 });
      console.log(`[Local MongoDB Connected]: ${localConn.connection.host}`);
    } catch (localErr) {
      console.warn(`[MongoDB Offline Mode]: Server running without DB persistence.`);
    }
  }
};

module.exports = connectDB;

