import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'blog_system',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error acquiring client', err.stack);
    return;
  }
  console.log('✅ Connected to PostgreSQL database');
  release();
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Database initialization function
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Use advisory lock to prevent concurrent initialization
    await client.query('SELECT pg_advisory_lock(12345)');
    
    // Check if initialization is needed
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      // Tables already exist, release lock and return
      await client.query('SELECT pg_advisory_unlock(12345)');
      return;
    }
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create blogs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        cover_image VARCHAR(500),
        tags TEXT[], -- Array of tags
        status VARCHAR(20) DEFAULT 'draft', -- draft, published
        views_count INTEGER DEFAULT 0,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create comments table (for future enhancement)
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
        author_name VARCHAR(100) NOT NULL,
        author_email VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
      CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
      CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING GIN(tags);
    `);

    // Create trigger for updating updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
      CREATE TRIGGER update_blogs_updated_at 
        BEFORE UPDATE ON blogs 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('📊 Database tables initialized successfully');
    
    // Release the advisory lock
    await client.query('SELECT pg_advisory_unlock(12345)');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    // Release lock on error too
    try {
      await client.query('SELECT pg_advisory_unlock(12345)');
    } catch (unlockError) {
      console.error('❌ Error releasing advisory lock:', unlockError);
    }
    throw error;
  } finally {
    client.release();
  }
};

export default pool; 