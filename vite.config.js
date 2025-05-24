import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { initializeCache, getAcceptableAnswers, addAcceptableAnswer } from './src/server/answerCache.js';
import { handleGradeRequest } from './src/server/gradeMiddleware.js';

// Initialize the cache
initializeCache();

// No OpenAI initialization here - it's now in the middleware

// https://vitejs.dev/config/
export default defineConfig({
  base: '/gmath_embed/',
  plugins: [react()],
  server: {
    port: 3004,
    open: true,
    // Add custom middleware for answer cache API
    middlewares: [
      (req, res, next) => {
        // Simple API for acceptable answers
        if (req.url === '/api/acceptable-answers' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { questionId, answer, action } = JSON.parse(body);
              
              if (action === 'get') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ answers: getAcceptableAnswers(questionId) }));
              } else if (action === 'add') {
                addAcceptableAnswer(questionId, answer);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(400);
                res.end('Invalid action');
              }
            } catch (err) {
              console.error('Error processing request:', err);
              res.writeHead(400);
              res.end('Invalid request');
            }
          });
          return;
        }
        // Add new endpoint for grading with three-step process
        if (req.url === '/api/grade' && req.method === 'POST') {
          // Use our middleware function to handle the request
          handleGradeRequest(req, res);
          return;
        }
        
        // Also handle the endpoint with the base path
        if (req.url === '/gmath_embed/api/grade' && req.method === 'POST') {
          // Use our middleware function to handle the request
          handleGradeRequest(req, res);
          return;
        }
        next();
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  define: {
    // This is needed to make process.env work in Vite
    'process.env': {}
  },
  // Add this new section to copy the KaTeX fonts
  build: {
    outDir: '_site/dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.woff2')) {
            return 'assets/fonts/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Add this to copy the KaTeX fonts from node_modules
  publicDir: 'public',
  copyPublicDir: true
}); 
