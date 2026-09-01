/**
 * Production-Level Authentication Controller for SPY Salon Enterprise REST API
 * Supports Email Address or Mobile Phone Number login.
 */
const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const getReqMeta = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1',
  userAgent: req.headers['user-agent'] || ''
});

exports.loginUser = async (req, res, next) => {
  try {
    const { email, phone, identifier, username, password, role } = req.body;
    const loginInput = identifier || email || phone || username;
    const reqMeta = getReqMeta(req);
    const result = await authService.login(loginInput, password, role, reqMeta);

    return ApiResponse.success(res, {
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    }, `Welcome back, ${result.user.name}!`);
  } catch (error) {
    next(error);
  }
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const reqMeta = getReqMeta(req);
    const result = await authService.register(name, email, phone, password, reqMeta);
    return ApiResponse.created(res, {
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    }, 'Account registered successfully! Please sign in with your credentials.');
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const reqMeta = getReqMeta(req);
    const result = await authService.refreshToken(refreshToken, reqMeta);
    return ApiResponse.success(res, result, 'Access token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const identifier = email || phone;
    const result = await authService.sendLoginOtp(identifier);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
exports.sendOtp = exports.sendOTP;

exports.verifyOTP = async (req, res, next) => {
  try {
    const { otp, email, phone } = req.body;
    const identifier = email || phone;
    const reqMeta = getReqMeta(req);
    const result = await authService.verifyLoginOtp(identifier, otp, reqMeta);
    return ApiResponse.success(res, {
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    }, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};
exports.verifyOtp = exports.verifyOTP;

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const result = await authService.resetPasswordWithOtp(email, otp, password);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('Please provide a new password (minimum 6 characters).');
    }

    const User = require('../models/User');
    const ActivityLog = require('../models/ActivityLog');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Account not found');

    user.password = newPassword;
    await user.save();

    await ActivityLog.create({
      action: 'Password Changed',
      details: `${user.name} updated account password securely.`,
      user: user.name,
      branchId: user.branchId || null
    });

    return ApiResponse.success(res, null, 'Password updated successfully!');
  } catch (error) {
    next(error);
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return ApiResponse.success(res, null, 'Session ended and logged out successfully');
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Not authorized to access user profile');
    }
    req.user.password = undefined;
    return ApiResponse.success(res, req.user, 'User session profile retrieved');
  } catch (error) {
    next(error);
  }
};

// Session Management Controllers
exports.getSessions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentRefreshToken = req.headers['x-refresh-token'] || req.body?.refreshToken || req.query?.refreshToken;
    const sessions = await authService.getActiveSessions(userId, currentRefreshToken);
    return ApiResponse.success(res, sessions, 'Active user sessions retrieved');
  } catch (error) {
    next(error);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const sessionId = req.params.sessionId || req.params.id;
    const result = await authService.revokeSession(userId, sessionId);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

exports.logoutAllSessions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentRefreshToken = req.headers['x-refresh-token'] || req.body?.refreshToken;
    const result = await authService.logoutAll(userId, currentRefreshToken);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
