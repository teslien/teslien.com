import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate, validateQuery, validateParams, blogSchema, blogUpdateSchema, blogQuerySchema, slugSchema } from '../middleware/validation.js';
import loggers from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Apply authentication middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// Utility function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

// Ensure unique slug
const ensureUniqueSlug = async (baseSlug, blogId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const query = blogId 
      ? 'SELECT id FROM blogs WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM blogs WHERE slug = $1';
    const params = blogId ? [slug, blogId] : [slug];
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Upload image endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    message: 'Image uploaded successfully',
    imageUrl: imageUrl 
  });
});

// Get all blogs (including drafts) with pagination
router.get('/blogs', validateQuery(blogQuerySchema), async (req, res) => {
  const { page, limit, search, tags, status, sort, order } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        b.id, b.title, b.slug, b.excerpt, b.cover_image, b.tags, 
        b.status, b.views_count, b.created_at, b.updated_at,
        u.username as author_name
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    // Add status filter
    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (b.title ILIKE $${paramCount} OR b.content ILIKE $${paramCount} OR b.excerpt ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      paramCount++;
      query += ` AND b.tags && $${paramCount}`;
      queryParams.push(tagArray);
    }

    // Add order by and pagination
    const sortField = sort === 'views' ? 'views_count' : (sort || 'updated_at');
    const sortOrder = order || 'desc';
    
    // Validate sort field for security
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'views_count'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'updated_at';
    const safeSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    
    query += ` ORDER BY b.${safeSortField} ${safeSortOrder.toUpperCase()} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM blogs b WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND b.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (b.title ILIKE $${countParamCount} OR b.content ILIKE $${countParamCount} OR b.excerpt ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      countParamCount++;
      countQuery += ` AND b.tags && $${countParamCount}`;
      countParams.push(tagArray);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalBlogs = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      blogs: result.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_blogs: totalBlogs,
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    loggers.logError('Get admin blogs error', error, { 
      userId: req.user?.id,
      query: req.query 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single blog by ID (for editing)
router.get('/blogs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        b.id, b.title, b.slug, b.content, b.excerpt, b.cover_image, 
        b.tags, b.status, b.views_count, b.created_at, b.updated_at,
        u.username as author_name
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    loggers.logError('Get blog by ID error', error, { 
      userId: req.user?.id,
      blogId: req.params.id 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new blog
router.post('/blogs', validate(blogSchema), async (req, res) => {
  const { title, content, excerpt, tags, status, cover_image } = req.body;

  try {
    // Generate slug from title
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const result = await pool.query(`
      INSERT INTO blogs (title, slug, content, excerpt, tags, status, cover_image, author_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, slug, content, excerpt, tags, status, cover_image, created_at, updated_at
    `, [title, slug, content, excerpt, tags || [], status || 'draft', cover_image, req.user.id]);

    res.status(201).json({
      message: 'Blog created successfully',
      blog: result.rows[0]
    });
  } catch (error) {
    loggers.logError('Create blog error', error, { 
      userId: req.user?.id,
      title: req.body.title 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Update blog
router.put('/blogs/:id', validate(blogUpdateSchema), async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, tags, status, cover_image } = req.body;

  try {
    // Check if blog exists
    const existingBlog = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (existingBlog.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Prepare update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);

      // Update slug if title changed
      const baseSlug = generateSlug(title);
      const slug = await ensureUniqueSlug(baseSlug, id);
      paramCount++;
      updates.push(`slug = $${paramCount}`);
      values.push(slug);
    }

    if (content !== undefined) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      values.push(content);
    }

    if (excerpt !== undefined) {
      paramCount++;
      updates.push(`excerpt = $${paramCount}`);
      values.push(excerpt);
    }

    if (tags !== undefined) {
      paramCount++;
      updates.push(`tags = $${paramCount}`);
      values.push(tags);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (cover_image !== undefined) {
      paramCount++;
      updates.push(`cover_image = $${paramCount}`);
      values.push(cover_image);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE blogs 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, slug, content, excerpt, tags, status, cover_image, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Blog updated successfully',
      blog: result.rows[0]
    });
  } catch (error) {
    loggers.logError('Update blog error', error, { 
      userId: req.user?.id,
      blogId: req.params.id,
      title: req.body.title 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blog
router.delete('/blogs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM blogs WHERE id = $1 RETURNING title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({ 
      message: 'Blog deleted successfully',
      title: result.rows[0].title 
    });
  } catch (error) {
    loggers.logError('Delete blog error', error, { 
      userId: req.user?.id,
      blogId: req.params.id 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard analytics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get blog counts by status
    const statusStats = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM blogs
      GROUP BY status
    `);

    // Get recent blogs
    const recentBlogs = await pool.query(`
      SELECT id, title, status, views_count, created_at
      FROM blogs
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get total views
    const viewStats = await pool.query(`
      SELECT SUM(views_count) as total_views
      FROM blogs
      WHERE status = 'published'
    `);

    // Get monthly blog creation stats
    const monthlyStats = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as blogs_created
      FROM blogs
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    res.json({
      status_counts: statusStats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      total_views: parseInt(viewStats.rows[0].total_views) || 0,
      recent_blogs: recentBlogs.rows,
      monthly_stats: monthlyStats.rows
    });
  } catch (error) {
    loggers.logError('Get dashboard stats error', error, { 
      userId: req.user?.id 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 