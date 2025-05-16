import React from 'react';
import { Link } from 'react-router-dom';

function HomeworkNavigation({ currentSlug }) {
  return (
    <div className="mb-6 flex space-x-2">
      <Link 
        to="/hw1" 
        className={`px-3 py-1 text-sm rounded ${currentSlug === 'hw1' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        Homework 1
      </Link>
      <Link 
        to="/hw2" 
        className={`px-3 py-1 text-sm rounded ${currentSlug === 'hw2' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        Homework 2
      </Link>
    </div>
  );
}

export default HomeworkNavigation; 