const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const connectDB = require('./config/db');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'SPY Salon Backend API', timestamp: new Date() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SPY Salon Backend Server]: Running on port ${PORT}`);
});
