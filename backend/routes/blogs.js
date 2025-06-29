import express from 'express';
import pool from '../config/database.js';
import { validateQuery, validateParams, blogQuerySchema, slugSchema } from '../middleware/validation.js';
import loggers from '../config/logger.js';

const router = express.Router();

// Utility function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

// Get all published blogs with pagination, search, and filtering
router.get('/', validateQuery(blogQuerySchema), async (req, res) => {
  const { page, limit, search, tags, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        b.id, b.title, b.slug, b.excerpt, b.cover_image, b.tags, 
        b.views_count, b.created_at, b.updated_at,
        u.username as author_name
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.status = 'published'
    `;
    
    const queryParams = [];
    let paramCount = 0;

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
    query += ` ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM blogs b
      WHERE b.status = 'published'
    `;
    
    const countParams = [];
    let countParamCount = 0;

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
    loggers.logError('Get blogs error', error, { 
      query: req.query 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blog by slug
router.get('/:slug', validateParams(slugSchema), async (req, res) => {
  const { slug } = req.params;

  try {
    // Get the blog and increment view count
    const result = await pool.query(`
      UPDATE blogs 
      SET views_count = views_count + 1 
      WHERE slug = $1 AND status = 'published'
      RETURNING 
        id, title, slug, content, excerpt, cover_image, tags, 
        views_count, created_at, updated_at, author_id
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const blog = result.rows[0];

    // Get author information
    const authorResult = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [blog.author_id]
    );

    const author = authorResult.rows[0] || { username: 'Unknown', email: '' };

    res.json({
      ...blog,
      author: {
        username: author.username,
        email: author.email
      }
    });
  } catch (error) {
    loggers.logError('Get blog by slug error', error, { 
      slug: req.params.slug 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get related blogs (by tags)
router.get('/:slug/related', validateParams(slugSchema), async (req, res) => {
  const { slug } = req.params;
  const limit = parseInt(req.query.limit) || 3;

  try {
    // First get the current blog's tags
    const currentBlogResult = await pool.query(
      'SELECT tags FROM blogs WHERE slug = $1 AND status = \'published\'',
      [slug]
    );

    if (currentBlogResult.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const currentTags = currentBlogResult.rows[0].tags || [];

    if (currentTags.length === 0) {
      return res.json({ blogs: [] });
    }

    // Get related blogs by tags
    const result = await pool.query(`
      SELECT 
        b.id, b.title, b.slug, b.excerpt, b.cover_image, b.tags,
        b.views_count, b.created_at,
        u.username as author_name
      FROM blogs b
      LEFT JOIN users u ON b.author_id = u.id
      WHERE b.status = 'published' 
        AND b.slug != $1 
        AND b.tags && $2
      ORDER BY 
        (SELECT COUNT(*) FROM unnest(b.tags) tag WHERE tag = ANY($2)) DESC,
        b.created_at DESC
      LIMIT $3
    `, [slug, currentTags, limit]);

    res.json({ blogs: result.rows });
  } catch (error) {
    loggers.logError('Get related blogs error', error, { 
      slug: req.params.slug,
      limit: req.query.limit 
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all unique tags
router.get('/meta/tags', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT unnest(tags) as tag
      FROM blogs 
      WHERE status = 'published' AND tags IS NOT NULL
      ORDER BY tag
    `);

    const tags = result.rows.map(row => row.tag);
    res.json({ tags });
  } catch (error) {
    loggers.logError('Get tags error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blog statistics
router.get('/meta/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_blogs,
        SUM(views_count) as total_views,
        COUNT(DISTINCT author_id) as total_authors,
        AVG(views_count) as avg_views_per_blog
      FROM blogs 
      WHERE status = 'published'
    `);

    const stats = result.rows[0];
    res.json({
      total_blogs: parseInt(stats.total_blogs),
      total_views: parseInt(stats.total_views) || 0,
      total_authors: parseInt(stats.total_authors),
      avg_views_per_blog: parseFloat(stats.avg_views_per_blog) || 0
    });
  } catch (error) {
    loggers.logError('Get stats error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 