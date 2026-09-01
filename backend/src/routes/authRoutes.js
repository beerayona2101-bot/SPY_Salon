const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logoutUser,
  getMe,
  getSessions,
  revokeSession,
  logoutAllSessions
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateRequest');
const rateLimiter = require('../middlewares/rateLimiter');

const loginLimiter = rateLimiter({ windowMs: 1 * 60 * 1000, max: 100, message: 'Too many login attempts. Please try again after a minute.' });
const otpSendLimiter = rateLimiter({ windowMs: 2 * 60 * 1000, max: 30, message: 'Too many OTP requests. Please try again after 2 minutes.' });
const otpVerifyLimiter = rateLimiter({ windowMs: 2 * 60 * 1000, max: 50, message: 'Too many verification attempts. Please try again after 2 minutes.' });

router.post('/register', loginLimiter, validateRequest({ required: ['name', 'password'], email: ['email'], phone: ['phone'], password: ['password'] }), registerUser);
router.post('/login', loginLimiter, validateRequest({ required: ['password'] }), loginUser);
router.post('/send-otp', otpSendLimiter, validateRequest({}), sendOTP);
router.post('/verify-otp', otpVerifyLimiter, validateRequest({ required: ['otp'] }), verifyOTP);
router.post('/forgot-password', otpSendLimiter, validateRequest({}), forgotPassword);
router.post('/reset-password', otpVerifyLimiter, validateRequest({ required: ['password'], password: ['password'] }), resetPassword);

// Protected routes
router.post('/change-password', protect, validateRequest({ required: ['newPassword'], password: ['newPassword'] }), changePassword);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

// Centralized Session Management Routes
router.get('/sessions', protect, getSessions);
router.post('/sessions/logout-all', protect, logoutAllSessions);
router.delete('/sessions/logout-all', protect, logoutAllSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

module.exports = router;
