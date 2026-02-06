// App.tsx - The main application component
// This component manages the login state and decides what screen to show the user

// Import React and useState hook for managing component state
import React, { useState } from "react";
// Import the Login component for user authentication
import Login from "./pages/login";
// Import Dashboard component (note: it's imported from taskpopup file which contains the task management dashboard)
import Dashboard from "./components/taskpopup";

// Define the main App component as a functional component
const App: React.FC = () => {
  // Track whether user is logged in - starts as false (not logged in)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Track whether to show the login modal popup
  const [showLoginModal, setShowLoginModal] = useState(false);
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

  // This function is called when login is successful
  // It receives the user data from the Login component and updates our state
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
    // Hide the login modal since we're now logged in
    setShowLoginModal(false);
  };

  return (
    <div className="app-container">
      {/* Show landing screen only when user is NOT logged in AND login modal is NOT showing */}
      {!isLoggedIn && !showLoginModal && (
        <div className="landing-screen">
          {/* Main app title on the landing page */}
          <h1>Task AI</h1>
          {/* Button to open the login modal when clicked */}
          <button className="try-btn" onClick={() => setShowLoginModal(true)}>Try it out</button>
        </div>
      )}

      {/* Show login modal when user clicks "Try it out" button */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Login form component - pass the success handler as a prop */}
            <Login onLogin={handleLoginSuccess} />
            {/* Cancel button to close the modal without logging in */}
            <button className="close-link" onClick={() => setShowLoginModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Show the Dashboard only when user is logged in and we have user data */}
      {/* The Dashboard receives the full user object so it can display personalized content */}
      {isLoggedIn && user && <Dashboard user={user} />}
    </div>
  );
};

// Export the App component so it can be imported in main.tsx
export default App;
