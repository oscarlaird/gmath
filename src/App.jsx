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
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto text-center">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h1 className="text-2xl font-bold text-center text-blue-600">Math Homework System</h1>
                  
                  {!loggedIn ? (
                    <LoginForm onLogin={handleLogin} />
                  ) : (
                    <div>
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h2 className="text-xl font-semibold">Welcome, {studentName || `Student ${studentId}`}</h2>
                            <p className="text-sm text-gray-500">Student ID: {studentId}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App; 