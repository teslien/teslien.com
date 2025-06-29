import Joi from 'joi';

// Generic validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// User registration validation schema
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Blog creation/update validation schema
export const blogSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  content: Joi.string().min(10).required(),
  excerpt: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  status: Joi.string().valid('draft', 'published').default('draft'),
  cover_image: Joi.string().allow('').optional()
});

// Blog update schema (allows partial updates)
export const blogUpdateSchema = Joi.object({
  title: Joi.string().min(5).max(255).optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  status: Joi.string().valid('draft', 'published').optional(),
  cover_image: Joi.string().allow('').optional()
});

// Comment validation schema
export const commentSchema = Joi.object({
  author_name: Joi.string().min(2).max(100).required(),
  author_email: Joi.string().email().required(),
  content: Joi.string().min(5).max(1000).required()
});

// Query parameter validation for blog list
export const blogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().max(100).allow('').optional(),
  tags: Joi.string().allow('').optional(),
  status: Joi.string().valid('draft', 'published').allow('').optional(),
  sort: Joi.string().valid('created_at', 'updated_at', 'title', 'views', 'views_count').allow('').optional(),
  order: Joi.string().valid('asc', 'desc').allow('').optional()
});

// Slug validation
export const slugSchema = Joi.object({
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required()
});

// Validate query parameters
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        details: error.details.map(detail => detail.message)
      });
    }
    req.query = value; // Use validated values
    next();
  };
};

// Validate URL parameters
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        message: 'Invalid URL parameters',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
}; 