const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fail hard at startup if JWT_SECRET is not configured — prevents falling back to a
// public constant that would allow arbitrary token forgery in a misconfigured environment.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. ' +
    'Set a strong random secret in your .env file before starting the server.'
  );
}

// Protect routes - JWT verification & Session Validation
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account associated with this token no longer exists.'
      });
    }

    if (user.status === 'Inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.'
    });
  }
};

// Optional auth - attaches user if valid token exists, but doesn't block guests
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && user.status !== 'Inactive') {
        req.user = user;
      }
    } catch (e) {}
  }
  next();
};

// Grant access to specific roles (RBAC)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route.`
      });
    }
    next();
  };
};

