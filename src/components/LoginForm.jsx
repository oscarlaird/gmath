import React, { useState } from 'react';

function LoginForm({ onLogin }) {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError('Please enter your student ID');
      return;
    }
    
    // Simple validation - ID should be numeric and have a reasonable length
    if (!/^\d{5,10}$/.test(studentId)) {
      setError('Student ID should be 5-10 digits');
      return;
    }
    
    onLogin(studentId);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Login to access your homework</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="studentId" className="block text-gray-700 mb-2">Student ID Number</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your student ID"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginForm; 