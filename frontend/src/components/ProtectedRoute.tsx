// ProtectedRoute.tsx - Route guard component for authentication
// This component protects routes that require a logged-in user
// If no token exists, it redirects to the auth page

// Import hooks for side effects and navigation
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Define the props interface - this component wraps other components
interface ProtectedRouteProps {
  // children is the component(s) that should be protected
  children: React.ReactNode;
}

// Define the ProtectedRoute component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Hook for programmatic navigation
  const navigate = useNavigate();
  // Hook to get the current location/URL - used to redirect back after login
  const location = useLocation();

  // useEffect runs after the component mounts
  // It checks if the user has a valid authentication token
  useEffect(() => {
    // Try to get the token from localStorage
    const token = localStorage.getItem('token');
    // If no token exists, user is not logged in
    if (!token) {
      // Redirect to auth page
      // replace: true prevents going back to protected page with browser back button
      // state: { from: location } saves where they tried to go, so we can redirect back after login
      navigate('/auth', { replace: true, state: { from: location } });
    }
  }, [navigate, location]); // Re-run if navigate or location changes

  // Check token again for the render decision
  // This is needed because useEffect runs after render
  const token = localStorage.getItem('token');
  // If no token, show a loading message while the redirect happens
  if (!token) {
    return <div className="loading">Redirecting...</div>;
  }

  // If token exists, render the protected children components
  // The empty fragment <></> is just a wrapper that doesn't add extra DOM elements
  return <>{children}</>;
};

// Export the component for use in the router configuration
export default ProtectedRoute;
