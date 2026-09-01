const mongoose = require('mongoose');

// Globally disable command buffering so queries fail fast
mongoose.set('bufferCommands', false);

// Register connection lifecycle event handlers
mongoose.connection.on('connected', () => {
  console.log('[Mongoose Event] Connected to MongoDB Atlas database');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Mongoose Event] Database connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('[Mongoose Event] Disconnected from database');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Mongoose Event] Reconnected to database');
});

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error('[FATAL ERROR] MONGO_URI environment variable is required.');
  }

  console.log('[MongoDB Init] Connecting to MongoDB Atlas cluster...');
  console.log(`[MongoDB Init] Target Database: spy_salon`);

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'spy_salon',
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB Atlas Connected Successfully]: Host ${conn.connection.host}`);
    console.log(`[MongoDB Atlas Connected Successfully]: Database Name: ${conn.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    console.error(`[FATAL DATABASE ERROR] MongoDB Atlas connection failed: ${error.message}`);
    throw new Error(`MongoDB Atlas Connection Failure: ${error.message}`);
  }
};

module.exports = connectDB;
