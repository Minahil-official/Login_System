// AuthPage.tsx - Alternative authentication page with login/signup toggle
// This component provides both login and signup functionality in one form

// Import useState hook for managing form state
import { useState } from 'react';
// Import useNavigate for programmatic navigation after login
import { useNavigate } from 'react-router-dom';
// Import configured axios instance for API calls
import api from '../api/axios';

// Define the AuthPage component
const AuthPage = () => {
  // State for the email input field
  const [email, setEmail] = useState('');
  // State for the password input field
  const [password, setPassword] = useState('');
  // Toggle between login (true) and signup (false) modes
  const [isLogin, setIsLogin] = useState(true);
  // Store error messages to display to the user
  const [error, setError] = useState('');
  // Track loading state to disable form during API call
  const [loading, setLoading] = useState(false);
  // Hook for navigating to different pages programmatically
  const navigate = useNavigate();

  // Handle form submission for both login and signup
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();
    // Clear any previous errors
    setError('');
    // Show loading state
    setLoading(true);

    try {
      // Choose the API endpoint based on whether we're logging in or signing up
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      // Send the request to the server
      const response = await api.post(endpoint, { email, password });
      // Store the received token in localStorage for future authenticated requests
      localStorage.setItem('token', response.data.access_token);
      // Navigate to the tasks page after successful authentication
      // replace: true prevents user from going back to login page with browser back button
      navigate('/tasks', { replace: true });
    } catch (err: any) {
      // Display error message from server, or a generic message if none provided
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      // Always turn off loading state when done
      setLoading(false);
    }
  };

  return (
    // Container with auth-page class for styling from index.css
    <div className="auth-page">
      {/* Form element with submit handler */}
      <form onSubmit={handleSubmit}>
        {/* Dynamic heading based on current mode */}
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {/* Email input field */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          // Disable input while loading to prevent changes during submission
          disabled={loading}
        />
        {/* Password input field */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={loading}
        />
        {/* Submit button - disabled when loading or when fields are empty */}
        <button type="submit" disabled={loading || !email || !password}>
          {/* Show appropriate button text based on loading and mode state */}
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
        {/* Display error message if there is one */}
        {error && <p className="error">{error}</p>}
        {/* Toggle button to switch between login and signup modes */}
        <button type="button" onClick={() => setIsLogin(!isLogin)} disabled={loading}>
          {/* Show appropriate text based on current mode */}
          {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
        </button>
      </form>
    </div>
  );
};

// Export the component for use in routing
export default AuthPage;
