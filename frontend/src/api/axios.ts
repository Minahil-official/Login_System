// axios.ts - Configured Axios instance for API calls
// This file sets up a pre-configured axios instance with authentication
// All API calls in the app should use this instance instead of raw axios

// Import axios library for making HTTP requests
import axios from "axios";
// Import the type for request config (for TypeScript type safety)
import type { InternalAxiosRequestConfig } from "axios";

// Create a configured axios instance with default settings
const api = axios.create({
  // baseURL is empty - requests will be relative to current domain
  // Vite proxy handles routing /auth and /tasks to the backend
  baseURL: '',
  // 30 second timeout - agent calls can take a while to respond
  timeout: 30000
});

// Add a request interceptor to automatically attach auth token to requests
// Interceptors run before every request is sent
api.interceptors.request.use(
  // Success handler - modify the config before sending
  (config: InternalAxiosRequestConfig) => {
    // Get the JWT token from localStorage (set during login)
    const token = localStorage.getItem("token");

    // If token exists, add it to the Authorization header
    // This authenticates the user for protected API endpoints
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Return the modified config to continue with the request
    return config;
  },
  // Error handler - if something goes wrong before sending
  (error) => {
    // Reject the promise to propagate the error
    return Promise.reject(error);
  }
);

// Export the configured instance for use throughout the app
export default api;
