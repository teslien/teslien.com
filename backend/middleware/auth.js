import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import loggers from '../config/logger.js';

// Verify JWT token middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    loggers.logAuth('Token Missing', null, {
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database to ensure they still exist
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      loggers.logAuth('User Not Found', decoded.userId, {
        ip: req.ip || req.connection.remoteAddress,
        url: req.originalUrl,
        method: req.method
      });
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = result.rows[0];
    loggers.logAuth('Token Verified', req.user.id, {
      username: req.user.username,
      role: req.user.role,
      ip: req.ip || req.connection.remoteAddress
    });
    next();
  } catch (error) {
    loggers.logAuth('Token Verification Failed', null, {
      error: error.message,
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Verify admin role middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    loggers.logSecurityEvent('Unauthorized Admin Access Attempt', {
      userId: req.user?.id || null,
      username: req.user?.username || null,
      userRole: req.user?.role || null,
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  loggers.logAuth('Admin Access Granted', req.user.id, {
    username: req.user.username,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress
  });
  next();
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Refresh token validation
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}; 