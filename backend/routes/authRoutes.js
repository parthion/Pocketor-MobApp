/**
 * Authentication Routes
 * Endpoints for user authentication (register, login, etc.)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
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
      const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
      const User = require('../models/User');
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

    // Generate and store refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await UserRepository.storeRefreshToken(user.id, refreshToken, refreshExpires);

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
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
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

router.post('/logout', verifyToken, async (req, res) => {
  try {
    try {
      await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()', [req.userId]);
    } catch (e) { /* non-fatal */ }

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

/**
 * POST /api/auth/check-user
 * Check if a user exists by email
 */
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await UserRepository.getByEmail(email);

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: { exists: user !== null },
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

/**
 * POST /api/auth/send-otp
 * Send OTP to email or phone
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Email or phone is required',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const id = uuidv4();
    const contact = email || phone;
    const contactType = email ? 'email' : 'phone';

    await pool.execute(
      'INSERT INTO otp_codes (id, contact, contact_type, code, expires_at) VALUES (?, ?, ?, ?, ?)',
      [id, contact, contactType, otp, expiresAt]
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'OTP sent',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify an OTP code
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Contact and OTP are required',
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM otp_codes WHERE contact = ? AND is_verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [contact]
    );

    if (rows.length === 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'OTP not found',
      });
    }

    const record = rows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    if (record.attempt_count >= 5) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Maximum OTP attempts exceeded',
      });
    }

    if (record.code !== otp) {
      await pool.execute(
        'UPDATE otp_codes SET attempt_count = attempt_count + 1 WHERE id = ?',
        [record.id]
      );
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    await pool.execute(
      'UPDATE otp_codes SET is_verified = TRUE WHERE id = ?',
      [record.id]
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'OTP verified',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request a password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await UserRepository.getByEmail(email);

    let resetToken;
    if (user) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await pool.execute(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [resetToken, resetExpires, user.id]
      );
    }

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'If this email is registered, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' && user && { resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset user password using token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Email, token, and new password are required',
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const user = rows[0];
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hash, user.id]
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const tokenRecord = await UserRepository.getRefreshToken(refreshToken);

    if (!tokenRecord) {
      return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const user = await UserRepository.getById(tokenRecord.user_id);
    if (!user) {
      return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'User not found',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

/**
 * PUT /api/auth/users/:id/password
 * Update user password (admin or own account)
 */
router.put('/users/:id/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.userId !== req.params.id && req.userRole !== 'admin') {
      return res.status(constants.STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'Forbidden: you can only update your own password',
      });
    }

    if (!newPassword) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'New password is required',
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    if (req.userRole !== 'admin') {
      if (!currentPassword) {
        return res.status(constants.STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: 'Current password is required',
        });
      }

      const isValid = await UserRepository.verifyPassword(req.params.id, currentPassword);
      if (!isValid) {
        return res.status(constants.STATUS_CODES.UNAUTHORIZED).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);

    res.status(constants.STATUS_CODES.OK).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      success: false,
      message: constants.MESSAGES.ERROR,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

module.exports = router;
