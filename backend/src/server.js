const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env', override: true });
require('dotenv').config({ override: true });

// Enforce environment validation on startup
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`[FATAL ERROR]: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const connectDB = require('./config/db');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const profileRoutes = require('./routes/profileRoutes');
const enquiryTemplateRoutes = require('./routes/enquiryTemplateRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const ApiError = require('./utils/apiError');

const compression = require('compression');

// Express application initialization
const app = express();

// High-Performance Middleware Setup: Compression & Response Timer
app.use(compression({
  threshold: 512, // Compress payloads larger than 512 bytes
  level: 6
}));

app.use((req, res, next) => {
  const startMs = Date.now();
  const oldWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const durationMs = Date.now() - startMs;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    return oldWriteHead.apply(res, args);
  };
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : [];

app.use(cors({ 
  origin: (origin, callback) => {
    if (
      !origin || 
      corsOrigins.includes('*') || 
      corsOrigins.includes(origin) || 
      process.env.NODE_ENV === 'development' || 
      origin.startsWith('http://192.168.') || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/membership', membershipRoutes);
app.use('/api/v1/user/profile', profileRoutes);
app.use('/api/v1/enquiry-templates', enquiryTemplateRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
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

const startServer = async () => {
  try {
    console.log('Loading environment...');
    
    // Connect to MongoDB and wait
    const conn = await connectDB();
    console.log(`[MongoDB Connected Successfully]: Database: ${conn.connection.name}`);
    
    console.log('Starting SPY Salon server...');
    const server = http.createServer(app);
    initSocket(server);
    
    server.listen(PORT, () => {
      console.log(`[SPY Salon Enterprise REST API & Realtime Server]: Running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`[FATAL ERROR]: Server failed to start: ${err.message}`);
    process.exit(1);
  }
};

startServer();
