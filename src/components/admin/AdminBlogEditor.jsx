import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { useForm } from 'react-hook-form';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminBlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blog, setBlog] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      tags: [],
      status: 'draft',
      cover_image: ''
    }
  });

  const watchedStatus = watch('status');

  // Load blog data if editing
  useEffect(() => {
    if (isEditing) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBlogById(id);
      setBlog(response);
      
      // Populate form
      setValue('title', response.title);
      setValue('excerpt', response.excerpt || '');
      setValue('content', response.content);
      setValue('tags', response.tags || []);
      setValue('status', response.status);
      setValue('cover_image', response.cover_image || '');
      setCoverImagePreview(response.cover_image || '');
    } catch (error) {
      toast.error('Failed to load blog post');
      navigate('/admin/blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const response = await adminAPI.uploadImage(file);
      // Use the API base URL for consistency
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const imageUrl = `${API_BASE_URL}${response.imageUrl}`;
      
      setValue('cover_image', imageUrl);
      setCoverImagePreview(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      // Get content from TinyMCE
      const content = editorRef.current?.getContent() || '';
      
      if (!content.trim()) {
        toast.error('Content is required');
        return;
      }

      const blogData = {
        ...data,
        content,
        tags: typeof data.tags === 'string' ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : data.tags
      };

      let response;
      if (isEditing) {
        response = await adminAPI.updateBlog(id, blogData);
        toast.success('Blog updated successfully');
      } else {
        response = await adminAPI.createBlog(blogData);
        toast.success('Blog created successfully');
      }

      // Redirect to blog list or continue editing
      if (data.status === 'published') {
        navigate('/admin/blogs');
      } else {
        if (!isEditing) {
          navigate(`/admin/blogs/edit/${response.blog.id}`);
        }
      }
    } catch (error) {
      toast.error(isEditing ? 'Failed to update blog' : 'Failed to create blog');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    setValue('status', 'published');
    handleSubmit(onSubmit)();
  };

  const handleSaveDraft = () => {
    setValue('status', 'draft');
    handleSubmit(onSubmit)();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" text="Loading blog..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
        <Link
          to="/admin/blogs"
          className="text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-md transition-colors"
        >
          ← Back to Blogs
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })}
            className={`w-full px-3 py-2 border ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Enter blog title..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Cover Image */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          
          {coverImagePreview && (
            <div className="mb-4">
              <img
                src={coverImagePreview}
                alt="Cover preview"
                className="w-full h-48 object-cover rounded-md"
                onError={(e) => {
                  console.error('Image failed to load:', coverImagePreview);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', coverImagePreview);
                }}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              {uploading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Uploading...</span>
                </div>
              ) : (
                'Upload Image'
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            
            {coverImagePreview && (
              <button
                type="button"
                onClick={() => {
                  setCoverImagePreview('');
                  setValue('cover_image', '');
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove Image
              </button>
            )}
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <Editor
            apiKey="qagffr3pkuv17a8on1afax661irst1hbr4e6tbv888sz91jc" // Free API key
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={blog?.content || '<p>Start writing your blog content...</p>'}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px }',
              branding: false
            }}
          />
        </div>

        {/* Excerpt */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            rows={3}
            {...register('excerpt', { maxLength: { value: 500, message: 'Excerpt must be less than 500 characters' } })}
            className={`w-full px-3 py-2 border ${errors.excerpt ? 'border-red-300' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Brief description of your blog post..."
          />
          {errors.excerpt && (
            <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            {...register('tags')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="web development, react, javascript (comma separated)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter tags separated by commas
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('status')}
                  value="draft"
                  className="text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Save as Draft</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  {...register('status')}
                  value="published"
                  className="text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Publish</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {saving && watchedStatus === 'draft' ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </div>
                ) : (
                  'Save Draft'
                )}
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving && watchedStatus === 'published' ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Publishing...</span>
                  </div>
                ) : (
                  'Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminBlogEditor; 