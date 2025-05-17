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
  
  // Normalize a string for comparison (trim whitespace and convert to lowercase)
  const normalizeString = (str) => {
    return str.trim().toLowerCase();
  };
  
  // Verify student credentials against database
  const verifyStudentCredentials = async (id, providedName) => {
    try {
      console.log("Verifying credentials for student ID:", id);
      
      const { data, error } = await supabase
        .from('students')
        .select('name')
        .eq('stud_id', id)
        .single();
      
      if (error) {
        console.error('Error fetching student data:', error);
        setAuthError('Invalid student ID or name');
        return false;
      }
      
      if (!data || !data.name) {
        console.error('No student found with ID:', id);
        setAuthError('Invalid student ID or name');
        return false;
      }
      
      // Case-insensitive name comparison
      const normalizedProvidedName = normalizeString(providedName);
      const normalizedStoredName = normalizeString(data.name);
      
      console.log("Comparing names:", {
        provided: normalizedProvidedName,
        stored: normalizedStoredName
      });
      
      if (normalizedProvidedName !== normalizedStoredName) {
        console.error('Name mismatch for student ID:', id);
        setAuthError('Invalid student ID or name');
        return false;
      }
      
      // Credentials verified successfully
      setStudentName(data.name); // Use the name from the database for consistency
      return true;
    } catch (err) {
      console.error('Exception verifying student credentials:', err);
      setAuthError('An error occurred during authentication');
      return false;
    }
  };
  
  // Check for existing login on component mount
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
  
  // Handle login
  const handleLogin = async (id, providedName) => {
    setLoading(true);
    setAuthError('');
    
    // Verify credentials against database
    const isVerified = await verifyStudentCredentials(id, providedName);
    
    if (isVerified) {
      // Set cookies to expire in 7 days
      Cookies.set('studentId', id, { expires: 7 });
      Cookies.set('authenticatedName', studentName, { expires: 7 }); // Store the normalized name from database
      
      setStudentId(id);
      setLoggedIn(true);
    }
    
    setLoading(false);
  };
  
  // Handle logout
  const handleLogout = () => {
    Cookies.remove('studentId');
    Cookies.remove('authenticatedName');
    setStudentId('');
    setStudentName('');
    setLoggedIn(false);
    setAuthError('');
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