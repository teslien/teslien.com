# Full-Stack Blog System

A comprehensive blog system built with **PostgreSQL**, **Node.js/Express**, and **React** featuring a modern UI, admin dashboard, and advanced blog management capabilities.

## 🚀 Features

### Backend Features
- **PostgreSQL Database** with optimized schema and indexes
- **RESTful API** with comprehensive endpoints
- **JWT Authentication** for secure admin access
- **Input Validation** with Joi
- **File Upload** support for blog cover images
- **Advanced Search** and filtering capabilities
- **Pagination** for optimal performance
- **Rate Limiting** and security middleware
- **Database Triggers** for automatic timestamp updates

### Frontend Features
- **React Router** for seamless navigation
- **Responsive Design** with Tailwind CSS
- **Blog Management** with WYSIWYG editor
- **Image Upload** with preview
- **Search & Filter** functionality
- **Tag-based** categorization
- **Admin Dashboard** with analytics
- **Real-time Toast** notifications
- **Loading States** and error handling

### Admin Features
- **Secure Login** with JWT tokens
- **Blog CRUD Operations** (Create, Read, Update, Delete)
- **Draft/Published** status management
- **Rich Text Editor** for content creation
- **Image Upload** and management
- **Tags Management**
- **Analytics Dashboard**
- **Responsive Admin Interface**

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd blog-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE blog_system;
CREATE USER blog_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE blog_system TO blog_user;
```

#### Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog_system
DB_USER=blog_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
UPLOAD_PATH=backend/uploads
MAX_FILE_SIZE=5242880
```

### 4. Start the Application
```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run server  # Backend only
npm run client  # Frontend only
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:5173/admin

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blogs Table
```sql
CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image VARCHAR(500),
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  author_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 API Endpoints

### Authentication Routes
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Register new admin
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Public Blog Routes
- `GET /api/blogs` - Get published blogs (with pagination, search, filter)
- `GET /api/blogs/:slug` - Get blog by slug
- `GET /api/blogs/:slug/related` - Get related blogs
- `GET /api/blogs/meta/tags` - Get all tags
- `GET /api/blogs/meta/stats` - Get blog statistics

### Admin Routes (Protected)
- `GET /api/admin/blogs` - Get all blogs (including drafts)
- `GET /api/admin/blogs/:id` - Get blog by ID
- `POST /api/admin/blogs` - Create new blog
- `PUT /api/admin/blogs/:id` - Update blog
- `DELETE /api/admin/blogs/:id` - Delete blog
- `POST /api/admin/upload` - Upload image
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## 🎨 Frontend Routes

### Public Routes
- `/` - Business template homepage
- `/blog` - Blog listing page
- `/blog/:slug` - Individual blog post

### Admin Routes (Protected)
- `/admin/login` - Admin login page
- `/admin` - Admin dashboard
- `/admin/blogs` - Blog management
- `/admin/blogs/new` - Create new blog
- `/admin/blogs/edit/:id` - Edit existing blog

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Input Validation** with Joi schemas
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configured origins
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with helmet middleware

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- **Desktop** (1024px and above)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)

## 🛠️ Development

### Project Structure
```
blog-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── blogs.js
│   │   │   └── admin.js
│   │   ├── uploads/
│   │   └── server.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── blog/
│   │   │   └── ui/
│   │   ├── context/
## Layout
- Header
- Hero section
- Features section
- Billing section
- Product showcase section
- Testimonials section
- Clients section
- Call to action section
- Footer

## Built With
- React.js
- Tailwind CSS
- Vite

## Acknowledgments
- [**Original Figma Design**](https://www.figma.com/file/bUGIPys15E78w9bs1l4tgS/Teslien?node-id=310%3A485&t=Jkk7MU9hZJ5HoVph-0)
- [**JavaScript Mastery video**](https://youtu.be/_oO4Qi5aVZs)
