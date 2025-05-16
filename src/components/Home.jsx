import React from 'react';
import { Link } from 'react-router-dom';

function Home({ studentId }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Welcome, Student {studentId}</h2>
      
      <p className="mb-4 text-gray-600">
        Select a homework assignment to begin:
      </p>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link 
          to="/hw1" 
          className="p-4 border rounded-lg bg-white hover:bg-blue-50 transition-colors flex flex-col items-center text-center"
        >
          <h3 className="font-medium text-lg mb-2">Homework 1</h3>
          <p className="text-sm text-gray-500">Algebra, Calculus, and Probability</p>
          <span className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">3 Questions</span>
        </Link>
        
        <Link 
          to="/hw2" 
          className="p-4 border rounded-lg bg-white hover:bg-blue-50 transition-colors flex flex-col items-center text-center"
        >
          <h3 className="font-medium text-lg mb-2">Homework 2</h3>
          <p className="text-sm text-gray-500">Geometry, Word Problems, and Conversions</p>
          <span className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">5 Questions</span>
        </Link>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Important Notice</h3>
        <p className="text-sm text-yellow-700">
          Remember to complete all assignments by their due dates. Your progress is automatically saved.
        </p>
      </div>
    </div>
  );
}

export default Home; 