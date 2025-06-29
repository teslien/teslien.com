import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Business template components
import BusinessTemplate from './components/BusinessTemplate'

// Blog components 
import BlogList from './components/blog/BlogList'
import BlogPost from './components/blog/BlogPost'
import BlogLayout from './components/blog/BlogLayout'

// Admin components
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './components/admin/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminBlogList from './components/admin/AdminBlogList'
import AdminBlogEditor from './components/admin/AdminBlogEditor'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Context providers
import { AuthProvider } from './context/AuthContext'

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Business Template - Home */}
            <Route path="/" element={<BusinessTemplate />} />
            
            {/* Blog Routes */}
            <Route path="/blog" element={<BlogLayout />}>
              <Route index element={<BlogList />} />
              <Route path=":slug" element={<BlogPost />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="blogs" element={<AdminBlogList />} />
              <Route path="blogs/new" element={<AdminBlogEditor />} />
              <Route path="blogs/edit/:id" element={<AdminBlogEditor />} />
            </Route>
          </Routes>
          
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App