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
  const [authError, setAuthError] = useState('');
  
  const normalizeString = (str) => {
    return str.trim().toLowerCase();
  };
  
  const verifyStudentCredentials = async (id, providedName) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('name')
        .eq('stud_id', id)
        .single();
      
      if (error || !data || !data.name) {
        setAuthError('Invalid student ID or name');
        return false;
      }
      
      if (normalizeString(providedName) !== normalizeString(data.name)) {
        setAuthError('Invalid student ID or name');
        return false;
      }
      
      setStudentName(data.name);
      return true;
    } catch (err) {
      setAuthError('An error occurred during authentication');
      return false;
    }
  };
  
  useEffect(() => {
    const checkSavedLogin = async () => {
      const savedStudentId = Cookies.get('studentId');
      const savedStudentName = Cookies.get('authenticatedName');
      
      if (savedStudentId && savedStudentName) {
        setStudentId(savedStudentId);
        setStudentName(savedStudentName);
        setLoggedIn(true);
      }
      
      setLoading(false);
    };
    
    checkSavedLogin();
  }, []);
  
  const handleLogin = async (id, providedName) => {
    setLoading(true);
    setAuthError('');
    
    const isVerified = await verifyStudentCredentials(id, providedName);
    
    if (isVerified) {
      Cookies.set('studentId', id, { expires: 7 });
      Cookies.set('authenticatedName', studentName, { expires: 7 });
      
      setStudentId(id);
      setLoggedIn(true);
    }
    
    setLoading(false);
  };
  
  const handleLogout = () => {
    Cookies.remove('studentId');
    Cookies.remove('authenticatedName');
    setStudentId('');
    setStudentName('');
    setLoggedIn(false);
    setAuthError('');
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
    <Router basename="/gmath_embed">
      <div className="min-h-screen bg-[#f5f5f0] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 border border-[#d1d1c7] bg-white">
            <header className="pb-4 mb-8 border-b border-[#e5e5dc]">
              <h1 className="text-2xl font-normal text-center text-[#5a7d7c]">LairdMath Homework Submission Portal</h1>
            </header>
            
            {!loggedIn ? (
              <>
                <LoginForm onLogin={handleLogin} />
                {authError && (
                  <div className="mt-4 p-3 border border-[#e76f51] bg-[#fdf5f0] text-[#e76f51]">
                    {authError}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="mb-8 pb-4 border-b border-[#e5e5dc]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-normal text-[#5a7d7c]">Welcome, {studentName}</h2>
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
