// App.tsx - The main application component
// This component manages the login state and decides what screen to show the user

// Import React and useState hook for managing component state
import React, { useState, useEffect } from "react";
// Import the new AuthForm component for login/signup
import AuthForm from "./components/AuthForm";
// Import Dashboard component (note: it's imported from taskpopup file which contains the task management dashboard)
import Dashboard from "./components/taskpopup";

// Define the main App component as a functional component
const App: React.FC = () => {
  // Track whether user is logged in - starts as false (not logged in)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Store the logged-in user's information, null means no user logged in
  // This object contains all the user details we get back from the server after login
  const [user, setUser] = useState<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
  } | null>(null);

  // Check if user is already logged in (has token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser({
          id: userData.id,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          token: token
        });
        setIsLoggedIn(true);
      } catch (error) {
        // Invalid user data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
      }
    }
  }, []);

  // This function is called when login/signup is successful
  // It receives the user data from the AuthForm component and updates our state
  const handleLoginSuccess = (userData: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
  }) => {
    // Save the user data to state
    setUser(userData);
    // Mark user as logged in
    setIsLoggedIn(true);
  };

  return (
    <div className="app-container">
      {/* Show AuthForm (login/signup) when user is NOT logged in */}
      {!isLoggedIn && (
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Show the Dashboard only when user is logged in and we have user data */}
      {/* The Dashboard receives the full user object so it can display personalized content */}
      {isLoggedIn && user && <Dashboard user={user} />}
    </div>
  );
};

// Export the App component so it can be imported in main.tsx
export default App;
