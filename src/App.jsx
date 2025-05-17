import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { supabase } from './supabaseClient.js';
import LoginForm from './components/LoginForm.jsx';
import MathQuestions from './components/MathQuestions.jsx';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Fetch student's name from Supabase
  const fetchStudentName = async (id) => {
    try {
      console.log("Fetching name for student ID:", id);
      const { data, error } = await supabase
        .from('students')
        .select('name')
        .eq('stud_id', id)
        .single();
      
      if (error) {
        console.error('Error fetching student data:', error);
        return;
      }
      
      console.log("Student data:", data);
      if (data && data.name) {
        setStudentName(data.name);
      }
    } catch (err) {
      console.error('Exception fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Check for existing login on component mount
  useEffect(() => {
    const savedStudentId = Cookies.get('studentId');
    if (savedStudentId) {
      setStudentId(savedStudentId);
      setLoggedIn(true);
      // Fetch the student's name if we have an ID from cookies
      fetchStudentName(savedStudentId);
    } else {
      setLoading(false);
    }
  }, []);
  
  // Handle login
  const handleLogin = async (id) => {
    // Set cookie to expire in 7 days
    Cookies.set('studentId', id, { expires: 7 });
    setStudentId(id);
    setLoggedIn(true);
    
    // Fetch the student's name when they log in
    await fetchStudentName(id);
  };
  
  // Handle logout
  const handleLogout = () => {
    Cookies.remove('studentId');
    setStudentId('');
    setStudentName('');
    setLoggedIn(false);
    // Force reload to clear any state
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center p-8 border border-[#d1d1c7] bg-white">
            <p className="text-[#6b7280]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#f5f5f0] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 border border-[#d1d1c7] bg-white">
            <header className="pb-4 mb-8 border-b border-[#e5e5dc]">
              <h1 className="text-2xl font-normal text-center text-[#5a7d7c]">Mr. George's Math Homework</h1>
            </header>
            
            {!loggedIn ? (
              <LoginForm onLogin={handleLogin} />
            ) : (
              <div>
                <div className="mb-8 pb-4 border-b border-[#e5e5dc]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-normal text-[#5a7d7c]">Welcome, {studentName || `Student ${studentId}`}</h2>
                      <p className="text-sm text-[#6b7280]">Student ID: {studentId}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1 text-sm bg-[#e8a87c] text-white border-none hover:bg-[#d9946c] transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <MathQuestions 
                        studentId={studentId} 
                      />
                    } 
                  />
                </Routes>
              </div>
            )}
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App; 