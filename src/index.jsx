import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Add event listener to disable pasting
document.addEventListener('paste', (e) => {
  e.preventDefault();
  console.log('Paste operation blocked');
}, true);

// Add event listener to catch Ctrl+V
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    console.log('Ctrl+V blocked');
  }
}, true);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 