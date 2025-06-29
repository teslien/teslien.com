# Logging System Documentation

## Overview

This application uses Winston for comprehensive logging with automatic file rotation, structured logging, and multiple log levels. All logs are stored in the `backend/logs/` directory with automatic daily rotation.

## Log Files Structure

```
backend/logs/
├── error-YYYY-MM-DD.log          # Error level logs only
├── combined-YYYY-MM-DD.log       # All log levels combined
├── app-YYYY-MM-DD.log            # Application logs (info level and above)
├── http-YYYY-MM-DD.log           # HTTP request logs
├── exceptions.log                # Unhandled exceptions
└── rejections.log                # Unhandled promise rejections
```

## Log Levels

- **ERROR**: Error events that might still allow the application to continue running
- **WARN**: Potentially harmful situations or security events
- **INFO**: Informational messages that highlight application progress
- **DEBUG**: Fine-grained informational events (development only)

## Usage Examples

### Basic Logging

```javascript
import loggers from '../config/logger.js';

// Info logging
loggers.info('User action completed', {
  userId: 123,
  action: 'create_post',
  timestamp: new Date().toISOString()
});

// Warning logging
loggers.warn('Rate limit approached', {
  userId: 123,
  requests: 95,
  limit: 100
});

// Error logging
loggers.error('Database connection failed', error, {
  operation: 'user_login',
  userId: 123
});

// Debug logging (development only)
loggers.debug('Processing request', {
  requestId: 'req-123',
  payload: requestData
});
```

### Specialized Logging Functions

#### Database Operations
```javascript
loggers.logDBOperation('INSERT', 'users', {
  username: 'john_doe',
  email: 'john@example.com'
});

loggers.logDBOperation('UPDATE', 'blogs', {
  blogId: 456,
  field: 'status',
  oldValue: 'draft',
  newValue: 'published'
});
```

#### Authentication Events
```javascript
loggers.logAuth('Login Successful', userId, {
  username: 'john_doe',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
});

loggers.logAuth('Password Changed', userId, {
  username: 'john_doe',
  ip: '192.168.1.100'
});
```

#### Security Events
```javascript
loggers.logSecurityEvent('Multiple Failed Login Attempts', {
  email: 'attacker@example.com',
  ip: '192.168.1.100',
  attempts: 5,
  timeWindow: '5 minutes'
});

loggers.logSecurityEvent('Suspicious File Upload', {
  userId: 123,
  filename: 'malicious.exe',
  fileType: 'application/octet-stream'
});
```

#### File Operations
```javascript
loggers.logFileOperation('upload', 'profile-image.jpg', {
  userId: 123,
  fileSize: '2.5MB',
  destination: '/uploads/images/'
});

loggers.logFileOperation('delete', 'old-backup.sql', {
  userId: 123,
  reason: 'cleanup'
});
```

### HTTP Request Logging

HTTP requests are automatically logged by the `requestLogger` middleware. Example log entry:

```json
{
  "timestamp": "2024-01-15 10:30:25",
  "level": "info",
  "message": "HTTP Request",
  "service": "blog-api-http",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": "45ms",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "userId": 123,
  "body": {
    "email": "user@example.com"
  }
}
```

## Route Integration Examples

### In Express Routes

```javascript
import express from 'express';
import loggers from '../config/logger.js';

const router = express.Router();

router.post('/create-blog', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Log the operation start
    loggers.info('Creating new blog post', {
      userId: req.user.id,
      title: title.substring(0, 50) + '...'
    });
    
    // Database operation
    loggers.logDBOperation('INSERT', 'blogs', {
      userId: req.user.id,
      title
    });
    
    const blog = await createBlog({ title, content, userId: req.user.id });
    
    // Success logging
    loggers.info('Blog post created successfully', {
      userId: req.user.id,
      blogId: blog.id,
      title
    });
    
    res.status(201).json({ success: true, blog });
    
  } catch (error) {
    // Error logging with context
    loggers.error('Failed to create blog post', error, {
      userId: req.user.id,
      title: req.body.title,
      contentLength: req.body.content?.length
    });
    
    res.status(500).json({ message: 'Server error' });
  }
});
```

### Error Handling with Context

```javascript
app.use((err, req, res, next) => {
  // Comprehensive error logging
  loggers.error('Unhandled server error', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

## Security Logging Best Practices

### 1. Authentication Events
```javascript
// Always log authentication attempts
loggers.logAuth('Login Attempt', null, {
  email: req.body.email,
  ip: req.ip,
  success: false,
  reason: 'invalid_password'
});
```

### 2. Authorization Failures
```javascript
// Log unauthorized access attempts
loggers.logSecurityEvent('Unauthorized API Access', {
  userId: req.user?.id,
  requiredRole: 'admin',
  userRole: req.user?.role,
  endpoint: req.originalUrl,
  ip: req.ip
});
```

### 3. Data Access
```javascript
// Log sensitive data access
loggers.info('Sensitive data accessed', {
  userId: req.user.id,
  dataType: 'user_personal_info',
  targetUserId: req.params.userId,
  reason: 'profile_view'
});
```

## Log Analysis

### Viewing Logs

```bash
# View latest error logs
tail -f backend/logs/error-$(date +%Y-%m-%d).log

# View HTTP requests
tail -f backend/logs/http-$(date +%Y-%m-%d).log

# Search for specific user activity
grep "userId.*123" backend/logs/combined-$(date +%Y-%m-%d).log

# Monitor authentication events
grep "Auth:" backend/logs/app-$(date +%Y-%m-%d).log
```

### Log Rotation

- Files rotate daily at midnight
- Maximum file size: 20MB (rotates early if exceeded)
- Retention period: 30 days
- Compressed old files are automatically cleaned up

## Environment Configuration

### Development
- Console logging enabled with colors
- Debug level logs included
- Pretty-printed format

### Production
- Console logging disabled
- Info level and above only
- JSON format for parsing
- File logging only

## Performance Considerations

1. **Async Logging**: All file operations are asynchronous
2. **Structured Data**: Use objects for metadata instead of string concatenation
3. **Sensitive Data**: Never log passwords, tokens, or sensitive user data
4. **Log Level**: Use appropriate log levels to control verbosity

## Monitoring Integration

The logs are structured for easy integration with monitoring tools:

- **ELK Stack**: JSON format ready for Elasticsearch
- **Splunk**: Structured logging compatible
- **CloudWatch**: AWS integration ready
- **Custom Analytics**: Easy to parse and analyze

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure write permissions on logs directory
2. **Disk Space**: Monitor disk usage with log rotation
3. **Performance**: Adjust log levels in production

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm start
```

This comprehensive logging system provides full visibility into your application's behavior, security events, and performance metrics. 