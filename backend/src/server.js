const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const connectDB = require('./config/db');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const ApiError = require('./utils/apiError');

const compression = require('compression');

const app = express();

// Connect MongoDB
connectDB();

// Global Security, Compression & Performance Middlewares
app.use(compression());
app.use(helmet());

const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : '*';

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || corsOrigins === '*' || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(morgan('dev'));

// Global Rate Limiter
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 50000 }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    statusCode: 200,
    status: 'UP', 
    service: 'SPY Salon Enterprise REST API', 
    timestamp: new Date() 
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/employee', employeeRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1', publicRoutes);

// 404 Route Not Found Middleware
app.use((req, res, next) => {
  next(ApiError.notFound(`The requested endpoint '${req.originalUrl}' does not exist on this server.`));
});

const http = require('http');
const { initSocket } = require('./utils/socket');

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`[SPY Salon Enterprise REST API & Realtime Server]: Running on port ${PORT}`);
});
