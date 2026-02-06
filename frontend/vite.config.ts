// vite.config.ts - Vite build tool configuration
// This file configures how Vite builds and serves the React application

// Import the defineConfig helper for type-safe configuration
import { defineConfig } from 'vite';
// Import the React plugin for Vite (enables JSX transformation)
import react from '@vitejs/plugin-react';

// Documentation: https://vitejs.dev/config/
export default defineConfig({
  // Register plugins - React plugin enables JSX/TSX support
  plugins: [react()],

  // Development server configuration
  server: {
    // Proxy configuration - forwards certain requests to the backend server
    // This solves CORS issues during development by making requests appear same-origin
    proxy: {
      // Forward all /auth/* requests to the backend API
      '/auth': {
        target: 'http://localhost:8000',  // Backend server address
        changeOrigin: true,  // Changes the origin header to match the target
        secure: false,  // Allow self-signed certificates (for local dev)
      },
      // Forward all /tasks/* requests to the backend API
      '/tasks': {
        target: 'http://localhost:8000',  // Backend server address
        changeOrigin: true,  // Changes the origin header to match the target
        secure: false,  // Allow self-signed certificates (for local dev)
      },
    },
  },
});
