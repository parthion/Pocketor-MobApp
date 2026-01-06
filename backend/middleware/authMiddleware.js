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
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Unexpected error
  res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
    success: false,
    message: constants.MESSAGES.SERVER_ERROR,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

module.exports = {
  verifyToken,
  validateRequest,
  validateEmail,
  validatePassword,
  validatePhone,
  errorHandler,
};
