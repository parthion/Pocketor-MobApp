/**
 * Authentication Middleware
 * Handles JWT verification and request validation
 */

const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

/**
 * Verify JWT token middleware
 * Checks if request has valid JWT token in Authorization header
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
      if (err) {
        return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }

      // Attach user info to request
      req.userId = decoded.id;
      req.userEmail = decoded.email;
      req.userRole = decoded.role;
      next();
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: constants.MESSAGES.UNAUTHORIZED,
    });
  }
};

/**
 * Validate request body middleware
 * Checks if required fields are present
 */
const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  // At least 6 characters
  if (password.length < 6) {
    return {
      valid: false,
      message: 'Password must be at least 6 characters long',
    };
  }
  return { valid: true };
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  // Simple validation: only digits, 10 characters
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Error handler middleware
 */
const verifyRole = (requiredRole) => (req, res, next) => {
  if (req.userRole !== requiredRole) {
    return res.status(constants.STATUS_CODES.FORBIDDEN).json({
      success: false,
      message: constants.MESSAGES.FORBIDDEN,
    });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Unexpected error
  res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
    success: false,
    message: constants.MESSAGES.SERVER_ERROR,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// Simple in-memory rate limiter
const _attempts = new Map();

/**
 * Rate limiter middleware
 * @param {number} maxAttempts - Max requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimiter = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => (req, res, next) => {
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = _attempts.get(key);

  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= maxAttempts) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again later.',
        });
      }
      entry.count += 1;
    } else {
      _attempts.set(key, { count: 1, resetAt: now + windowMs });
    }
  } else {
    _attempts.set(key, { count: 1, resetAt: now + windowMs });
  }

  next();
};

// Clean up old entries every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _attempts.entries()) {
    if (now >= entry.resetAt) _attempts.delete(key);
  }
}, 30 * 60 * 1000);

module.exports = {
  verifyToken,
  verifyRole,
  validateRequest,
  validateEmail,
  validatePassword,
  validatePhone,
  errorHandler,
  rateLimiter,
};
