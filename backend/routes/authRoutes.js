/**
 * Authentication Routes
 * Endpoints for user authentication (register, login, etc.)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const { verifyToken, validateEmail, validatePassword } = require('../middleware/authMiddleware');
const constants = require('../config/constants');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, name, phone, password, passwordConfirm } = req.body;

    // Validation
    if (!email || !password || !passwordConfirm || !name || !phone) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'All fields are required (email, name, phone, password)',
      });
    }

    if (password !== passwordConfirm) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (!validateEmail(email)) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    if (phone.length !== 10) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Phone number must be 10 digits',
      });
    }

    // Check if user exists
    const existingUser = await UserRepository.getByEmail(email);
    if (existingUser) {
      return res.status(constants.STATUS_CODES.CONFLICT).json({
        success: false,
        message: constants.MESSAGES.USER_EXISTS,
      });
    }

    // Create user
    const newUser = await UserRepository.create({
      email,
      name,
      phone,
      password,
    });

    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: {
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (!validateEmail(email)) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Find user
    const user = await UserRepository.getByEmail(email);
    if (!user) {
      return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: constants.MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Verify password
    const isPasswordValid = await UserRepository.verifyPassword(user.id, password);
    if (!isPasswordValid) {
      return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: constants.MESSAGES.INVALID_CREDENTIALS,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: constants.JWT.EXPIRE }
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await UserRepository.getById(req.userId);
    
    if (!user) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.USER_NOT_FOUND,
      });
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token deletion)
 */
router.post('/logout', verifyToken, (req, res) => {
  try {
    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
    });
  }
});

module.exports = router;
