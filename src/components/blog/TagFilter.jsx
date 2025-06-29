import React, { useState } from 'react';

const TagFilter = ({ tags, selectedTags, onTagChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTagToggle = (tag) => {
    const newSelected = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagChange(newSelected);
  };

  const clearAll = () => {
    onTagChange([]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="text-gray-700">
          {selectedTags.length > 0 
            ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
            : 'Filter by tags'
          }
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {selectedTags.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={clearAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
          )}
          
          <div className="p-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{tag}</span>
                </label>
              ))
            ) : (
              <div className="px-2 py-4 text-sm text-gray-500 text-center">
                No tags available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter; 