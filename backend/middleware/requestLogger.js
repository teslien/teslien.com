import loggers from '../config/logger.js';
const { logAPIRequest, logSecurityEvent } = loggers;

// HTTP Request Logging Middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response time
  res.end = function(...args) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log the request
    logAPIRequest(req, res, responseTime);
    
    // Log security events
    if (res.statusCode === 401) {
      logSecurityEvent('Unauthorized Access Attempt', {
        ip: req.ip || req.connection.remoteAddress,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
    }
    
    if (res.statusCode === 403) {
      logSecurityEvent('Forbidden Access Attempt', {
        ip: req.ip || req.connection.remoteAddress,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null
      });
    }
    
    if (res.statusCode >= 500) {
      logSecurityEvent('Server Error', {
        ip: req.ip || req.connection.remoteAddress,
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        userId: req.user?.id || null
      });
    }
    
    // Call original end function
    originalEnd.apply(this, args);
  };
  
  next();
};

export default requestLogger; 