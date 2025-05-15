import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm.jsx';
import MathQuestions from './components/MathQuestions.jsx';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  
  // Get IP address on component mount
  useEffect(() => {
    // This is a simple way to get an IP - in production you might use a more reliable service
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
  
  // Simulate logging in
  const handleLogin = (id) => {
    // In a real app, you would validate the ID
    setStudentId(id);
    setLoggedIn(true);
  };

  return (
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
                      <p className="text-sm text-gray-500">Student ID: {studentId}</p>
                      <p className="text-sm text-gray-500">IP Address: {ipAddress}</p>
                    </div>
                    <MathQuestions studentId={studentId} ipAddress={ipAddress} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 