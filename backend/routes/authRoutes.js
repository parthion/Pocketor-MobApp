/**
 * Authentication Routes
 * Endpoints for user authentication (register, login, etc.)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const { verifyToken, verifyRole, validateEmail, validatePassword } = require('../middleware/authMiddleware');
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

    const totalUsers = await UserRepository.getCount();
    if (totalUsers > 0) {
      return res.status(constants.STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'Registration is closed. Admin must create new users.',
      });
    }

    // Create first admin user
    const newUser = await UserRepository.create({
      email,
      name,
      phone,
      password,
      role: constants.APP_USER_ROLES.ADMIN,
    });

    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'Admin user registered successfully',
      data: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
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
 * Login user and return JWT token (supports email and phone)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password, loginType } = req.body;

    if (!password) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Find user by email or phone
    let user;
    if (loginType === 'phone' || (!email && phone)) {
      if (!phone) {
        return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
          success: false, message: 'Phone number is required',
        });
      }
      const pool = require('../config/database');
      const User = require('../models/User');
      const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
      if (rows.length > 0) user = User.fromDatabase(rows[0]);
    } else {
      if (!email) {
        return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
          success: false, message: 'Email is required',
        });
      }
      if (!validateEmail(email)) {
        return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
          success: false, message: 'Invalid email format',
        });
      }
      user = await UserRepository.getByEmail(email);
    }

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
      { id: user.id, email: user.email, role: user.role },
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
 * GET /api/auth/users
 * Get all app users (admin only)
 */
router.get('/users', verifyToken, verifyRole(constants.APP_USER_ROLES.ADMIN), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const users = await UserRepository.getAll(page, limit);

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: users.map((user) => user.toJSON()),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

router.post('/users', verifyToken, verifyRole(constants.APP_USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { email, name, phone, password, passwordConfirm, role } = req.body;

    if (!email || !name || !phone || !password || !passwordConfirm) {
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

    const existingUser = await UserRepository.getByEmail(email);
    if (existingUser) {
      return res.status(constants.STATUS_CODES.CONFLICT).json({
        success: false,
        message: constants.MESSAGES.USER_EXISTS,
      });
    }

    const newUser = await UserRepository.create({
      email,
      name,
      phone,
      password,
      role: role === constants.APP_USER_ROLES.ADMIN ? constants.APP_USER_ROLES.ADMIN : constants.APP_USER_ROLES.AGENT,
      createdBy: req.userId,
    });

    res.status(constants.STATUS_CODES.CREATED).json({
      success: true,
      message: 'User created successfully',
      data: newUser.toJSON(),
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

router.put('/users/:id', verifyToken, verifyRole(constants.APP_USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = Object.values(constants.APP_USER_ROLES);

    if (!role || !validRoles.includes(role)) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    const user = await UserRepository.update(req.params.id, { role });
    if (!user) {
      return res.status(constants.STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: constants.MESSAGES.USER_NOT_FOUND,
      });
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'User role updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

router.get('/users/:id', verifyToken, verifyRole(constants.APP_USER_ROLES.ADMIN), async (req, res) => {
  try {
    const user = await UserRepository.getById(req.params.id);
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
    console.error('Get user by ID error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      error: error.message,
    });
  }
});

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
