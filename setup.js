#!/usr/bin/env node

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 Blog System Setup\n');

async function setupEnvironment() {
  console.log('📝 Environment Configuration');
  
  const dbHost = await question('Database Host (localhost): ') || 'localhost';
  const dbPort = await question('Database Port (5432): ') || '5432';
  const dbName = await question('Database Name (blog_system): ') || 'blog_system';
  const dbUser = await question('Database User (postgres): ') || 'postgres';
  const dbPassword = await question('Database Password: ');
  
  const jwtSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const jwtRefreshSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=${jwtRefreshSecret}

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
UPLOAD_PATH=backend/uploads
MAX_FILE_SIZE=5242880
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Environment file created');
}

async function createAdminUser() {
  console.log('\n👤 Admin User Setup');
  
  const username = await question('Admin Username: ');
  const email = await question('Admin Email: ');
  const password = await question('Admin Password: ');
  
  // Save admin credentials for later use
  const adminSetup = {
    username,
    email,
    password
  };
  
  fs.writeFileSync('admin-setup.json', JSON.stringify(adminSetup, null, 2));
  console.log('✅ Admin user configuration saved');
  
  return adminSetup;
}

async function createSampleContent() {
  const createSample = await question('\n📝 Create sample blog posts? (y/n): ');
  
  if (createSample.toLowerCase() === 'y') {
    const samplePosts = [
      {
        title: "Welcome to Our Blog",
        content: `<h2>Welcome to our new blog!</h2>
<p>We're excited to share insights, tips, and stories with you. This is our first blog post, and we have many more exciting topics coming your way.</p>
<p>Stay tuned for:</p>
<ul>
<li>Industry insights and trends</li>
<li>Technical tutorials and guides</li>
<li>Company updates and news</li>
<li>Expert opinions and analysis</li>
</ul>
<p>Thank you for joining us on this journey!</p>`,
        excerpt: "Welcome to our new blog! We're excited to share insights, tips, and stories with you.",
        tags: ["welcome", "announcement", "blog"],
        status: "published"
      },
      {
        title: "Getting Started with Modern Web Development",
        content: `<h2>The Modern Web Development Landscape</h2>
<p>Web development has evolved significantly over the past few years. From simple HTML pages to complex single-page applications, the tools and technologies we use have become more sophisticated.</p>
<h3>Key Technologies</h3>
<p>Here are some essential technologies every modern web developer should know:</p>
<ul>
<li><strong>React</strong> - For building user interfaces</li>
<li><strong>Node.js</strong> - For server-side JavaScript</li>
<li><strong>PostgreSQL</strong> - For robust database management</li>
<li><strong>TypeScript</strong> - For type-safe JavaScript development</li>
</ul>
<p>These technologies form the foundation of modern web applications and provide developers with powerful tools to create scalable, maintainable applications.</p>`,
        excerpt: "Explore the essential technologies and practices that define modern web development.",
        tags: ["web development", "react", "nodejs", "tutorial"],
        status: "published"
      }
    ];
    
    fs.writeFileSync('sample-posts.json', JSON.stringify(samplePosts, null, 2));
    console.log('✅ Sample blog posts created');
  }
}

async function displayInstructions() {
  console.log('\n🎉 Setup Complete!\n');
  console.log('Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start PostgreSQL database');
  console.log('3. Run the application: npm run dev');
  console.log('\nThe application will be available at:');
  console.log('- Frontend: http://localhost:5173');
  console.log('- Backend API: http://localhost:5000');
  console.log('- Admin Panel: http://localhost:5173/admin');
  console.log('\n📚 Check README.md for detailed documentation');
  
  if (fs.existsSync('admin-setup.json')) {
    const adminData = JSON.parse(fs.readFileSync('admin-setup.json', 'utf8'));
    console.log('\n👤 Admin Login Credentials:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log('\n⚠️  Remember to delete admin-setup.json after first login for security!');
  }
}

async function main() {
  try {
    await setupEnvironment();
    await createAdminUser();
    await createSampleContent();
    await displayInstructions();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default { setupEnvironment, createAdminUser, createSampleContent }; 