import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import loggers from '../config/logger.js';

const router = express.Router();

// Register new admin user
router.post('/register', validate(registerSchema), async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      loggers.logAuth('Registration Failed - User Exists', null, {
        email,
        username,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    loggers.logDBOperation('INSERT', 'users', { username, email, role: 'admin' });
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, passwordHash, 'admin']
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    loggers.logAuth('User Registered Successfully', user.id, {
      username: user.username,
      email: user.email,
      role: user.role,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    loggers.error('Registration error', error, {
      email,
      username,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      loggers.logAuth('Login Failed - User Not Found', null, {
        email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      loggers.logAuth('Login Failed - Invalid Password', user.id, {
        username: user.username,
        email: user.email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    loggers.logAuth('Login Successful', user.id, {
      username: user.username,
      email: user.email,
      role: user.role,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    loggers.error('Login error', error, {
      email,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    loggers.error('Profile fetch error', error, {
      userId: req.user.id,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Logout (client-side token removal, but we can blacklist tokens in future)
router.post('/logout', authenticateToken, (req, res) => {
  // In a production app, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    loggers.error('Password change error', error, {
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip || req.connection.remoteAddress
    });
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 