import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

function LoginForm({ onLogin }) {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');

  // Check for remembered student ID
  useEffect(() => {
    const rememberedId = Cookies.get('lastStudentId');
    if (rememberedId) {
      setStudentId(rememberedId);
    }
    
    const rememberedName = Cookies.get('lastStudentName');
    if (rememberedName) {
      setStudentName(rememberedName);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate student ID
    if (!studentId.trim()) {
      setError('Please enter your student ID');
      return;
    }
    
    // Simple validation - ID should be numeric and have a reasonable length
    if (!/^\d{5,10}$/.test(studentId)) {
      setError('Student ID should be 5-10 digits');
      return;
    }
    
    // Validate name
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    // Remember the last used credentials (separate from the auth cookie)
    Cookies.set('lastStudentId', studentId, { expires: 30 });
    Cookies.set('lastStudentName', studentName, { expires: 30 });
    
    // Send both ID and name to the login handler
    onLogin(studentId, studentName);
  };

  return (
    <div>
      <h2 className="text-xl font-normal mb-6 text-[#5a7d7c]">Login to access your homework</h2>
      <form onSubmit={handleSubmit} className="border border-[#e5e5dc] p-6 bg-[#fafaf5]">
        <div className="mb-4">
          <label htmlFor="studentName" className="block text-[#6b7280] mb-2">Full Name</label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-3 py-2 border border-[#d1d1c7] focus:outline-none focus:border-[#85b7b6]"
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="studentId" className="block text-[#6b7280] mb-2">Student ID Number</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-[#d1d1c7] focus:outline-none focus:border-[#85b7b6]"
            placeholder="Enter your student ID"
          />
          {error && <p className="text-[#e76f51] text-sm mt-1">{error}</p>}
        </div>
        
        <button
          type="submit"
          className="w-full bg-[#85b7b6] text-white py-2 px-4 border-none hover:bg-[#5a7d7c] transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginForm; 