import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import LoginForm from './components/LoginForm.jsx';
import MathQuestions from './components/MathQuestions.jsx';
import Home from './components/Home.jsx';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  
  // Check for existing login on component mount
  useEffect(() => {
    const savedStudentId = Cookies.get('studentId');
    if (savedStudentId) {
      setStudentId(savedStudentId);
      setLoggedIn(true);
    }
    
    // Get IP address
    const getIpAddress = async () => {
      try {
        // Simulate IP logging - in a real app, you might get this from the server
        setIpAddress('192.168.1.' + Math.floor(Math.random() * 255));
      } catch (error) {
        console.error('Error fetching IP:', error);
        setIpAddress('Unknown');
      }
    };
    
    getIpAddress();
  }, []);
  
  // Handle login
  const handleLogin = (id) => {
    // Set cookie to expire in 7 days
    Cookies.set('studentId', id, { expires: 7 });
    setStudentId(id);
    setLoggedIn(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    Cookies.remove('studentId');
    setStudentId('');
    setLoggedIn(false);
    // Force reload to clear any state
    window.location.reload();
  };

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
                      <div className="mb-6 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Student ID: {studentId}</p>
                          <p className="text-sm text-gray-500">IP Address: {ipAddress}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Sign Out
                        </button>
                      </div>
                      <Routes>
                        <Route path="/" element={<Home studentId={studentId} />} />
                        <Route 
                          path="/:slug" 
                          element={
                            <MathQuestions 
                              studentId={studentId} 
                              ipAddress={ipAddress} 
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