# 🚀 Quick Start Guide

Get your blog system up and running in just a few minutes!

## Prerequisites ✅

- **Node.js** (v16+) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12+) - [Download here](https://www.postgresql.org/download/)

## Step 1: Database Setup 🗄️

1. **Start PostgreSQL** and connect to it:
   ```bash
   psql -U postgres
   ```

2. **Create the database**:
   ```sql
   CREATE DATABASE blog_system;
   CREATE USER blog_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE blog_system TO blog_user;
   \q
   ```

## Step 2: Project Setup ⚙️

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the setup script**:
   ```bash
   npm run setup
   ```
   This will:
   - Create your `.env` file
   - Set up admin credentials
   - Generate JWT secrets
   - Optional: Create sample blog posts

## Step 3: Start the Application 🚀

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173).

## Step 4: Access Your Blog System 🌐

- **Homepage**: http://localhost:5173
- **Blog**: http://localhost:5173/blog
- **Admin Panel**: http://localhost:5173/admin
- **API**: http://localhost:5000/api

## Step 5: Create Your First Admin User 👤

1. **Register as admin**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@example.com", 
       "password": "password123"
     }'
   ```

2. **Or use the setup credentials** (if you used the setup script)

## Step 6: Create Your First Blog Post 📝

1. Go to http://localhost:5173/admin/login
2. Log in with your admin credentials
3. Click "Create New Blog"
4. Write your first blog post!

## Common Issues & Solutions 🔧

### Database Connection Error
- Make sure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database exists

### Port Already in Use
- Change ports in `.env`:
  ```env
  PORT=3001
  FRONTEND_URL=http://localhost:3000
  ```

### Permission Denied
- Check file permissions:
  ```bash
  chmod 755 backend/uploads
  ```

## Environment Variables 📋

Your `.env` file should contain:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog_system
DB_USER=blog_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Next Steps 🎯

1. **Customize the design** - Edit Tailwind classes in components
2. **Add your content** - Create blog posts via admin panel
3. **Configure production** - Set up proper database and hosting
4. **Add features** - Implement the TODO components (editor, comments, etc.)

## Need Help? 💡

- Check the main [README.md](README.md) for detailed documentation
- Review the API endpoints in the backend routes
- Look at component structure in `src/components/`

## Production Deployment 🌍

For production deployment:

1. **Set environment to production**:
   ```env
   NODE_ENV=production
   ```

2. **Build the frontend**:
   ```bash
   npm run build
   ```

3. **Use environment-specific database**:
   - AWS RDS, Google Cloud SQL, or similar
   - Update connection strings in `.env`

4. **Deploy**:
   - Frontend: Netlify, Vercel, or S3
   - Backend: Heroku, AWS EC2, or similar

---

**🎉 Congratulations! Your blog system is now running!**

Visit http://localhost:5173 to see your new blog in action. 