import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogAPI } from '../../services/api';
import BlogCard from './BlogCard';
import SearchBar from './SearchBar';
import TagFilter from './TagFilter';
import Pagination from './Pagination';
import LoadingSpinner from '../ui/LoadingSpinner';

const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState({});

  // Get query parameters
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';
  const selectedTags = searchParams.get('tags') || '';

  // Fetch blogs based on current filters
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 9,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedTags && { tags: selectedTags })
      };
      
      const response = await blogAPI.getBlogs(params);
      setBlogs(response.blogs);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch blogs');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tags and stats
  const fetchMetadata = async () => {
    try {
      const [tagsResponse, statsResponse] = await Promise.all([
        blogAPI.getTags(),
        blogAPI.getStats()
      ]);
      setTags(tagsResponse.tags);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchQuery, selectedTags]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleSearch = (query) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  const handleTagFilter = (tagList) => {
    const newParams = new URLSearchParams(searchParams);
    if (tagList.length > 0) {
      newParams.set('tags', tagList.join(','));
    } else {
      newParams.delete('tags');
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <button 
          onClick={fetchBlogs}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover insights, tips, and stories from our expert team
        </p>
      </div>

      {/* Stats */}
      {stats.total_blogs > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{stats.total_blogs}</div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{stats.total_views}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{stats.total_authors}</div>
              <div className="text-sm text-gray-600">Authors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">{Math.round(stats.avg_views_per_blog)}</div>
              <div className="text-sm text-gray-600">Avg Views</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              onSearch={handleSearch} 
              initialValue={searchQuery}
              placeholder="Search articles..."
            />
          </div>
          <div className="lg:w-80">
            <TagFilter 
              tags={tags}
              selectedTags={selectedTags.split(',').filter(Boolean)}
              onTagChange={handleTagFilter}
            />
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      {blogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <Pagination 
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-gray-500 text-lg">
            {searchQuery || selectedTags ? 'No blogs found matching your criteria.' : 'No blogs available yet.'}
          </div>
          {(searchQuery || selectedTags) && (
            <button 
              onClick={() => {
                setSearchParams({});
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogList; 