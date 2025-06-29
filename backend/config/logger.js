import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return log;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure daily rotate file transport for errors
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  handleExceptions: true,
  handleRejections: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Configure daily rotate file transport for all logs
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Configure daily rotate file transport for application logs
const appRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Configure daily rotate file transport for HTTP requests
const httpRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'blog-api' },
  transports: [
    errorRotateTransport,
    combinedRotateTransport,
    appRotateTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// HTTP Logger - separate instance for HTTP requests
const httpLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'blog-api-http' },
  transports: [
    httpRotateTransport,
    combinedRotateTransport
  ]
});

// Add console for HTTP logs in development
if (process.env.NODE_ENV !== 'production') {
  httpLogger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Utility functions for structured logging
const loggers = {
  // Main application logger
  logger,
  
  // HTTP request logger
  httpLogger,
  
  // Convenience methods
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  
  error: (message, error = null, meta = {}) => {
    const logMeta = { ...meta };
    
    if (error) {
      if (error instanceof Error) {
        logMeta.error = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      } else {
        logMeta.error = error;
      }
    }
    
    logger.error(message, logMeta);
  },
  
  // Alias for error function - more explicit
  logError: (message, error = null, meta = {}) => {
    const logMeta = { ...meta };
    
    if (error) {
      if (error instanceof Error) {
        logMeta.error = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      } else {
        logMeta.error = error;
      }
    }
    
    logger.error(message, logMeta);
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },
  
  // Database operation logging
  logDBOperation: (operation, table, meta = {}) => {
    logger.info(`Database ${operation}`, {
      operation,
      table,
      ...meta
    });
  },
  
  // API request logging
  logAPIRequest: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || null
    };
    
    // Log body for POST/PUT requests (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const body = { ...req.body };
      delete body.password;
      delete body.token;
      logData.body = body;
    }
    
    // Log query parameters
    if (Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }
    
    httpLogger.info('HTTP Request', logData);
  },
  
  // Authentication logging
  logAuth: (action, userId, meta = {}) => {
    logger.info(`Auth: ${action}`, {
      action,
      userId,
      ...meta
    });
  },
  
  // File operation logging
  logFileOperation: (operation, filename, meta = {}) => {
    logger.info(`File ${operation}`, {
      operation,
      filename,
      ...meta
    });
  },
  
  // Security event logging
  logSecurityEvent: (event, meta = {}) => {
    logger.warn(`Security Event: ${event}`, {
      event,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

// Log rotation event handlers
errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename, type: 'error' });
});

combinedRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename, type: 'combined' });
});

appRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename, type: 'app' });
});

httpRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info('Log file rotated', { oldFilename, newFilename, type: 'http' });
});

export default loggers; 