// login.tsx - Login form component
// This component handles user authentication with email and password

// Import React and hooks for state management and form handling
import React, { useState, type FormEvent } from "react";

// Define the props interface - what data this component expects from its parent
interface LoginProps {
  // onLogin is a callback function that gets called when login succeeds
  // It receives the user data to pass back to the parent component (App)
  onLogin: (userData: { id: number; username: string; first_name: string; last_name: string; email: string; token: string }) => void;
}

// Define the Login component with TypeScript generics for type safety
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // State to store the email input value
  const [email, setEmail] = useState("");
  // State to store the password input value
  const [password, setPassword] = useState("");
  // State to store any error messages to display to the user
  const [error, setError] = useState("");
  // State to track if we're currently waiting for the server response
  const [loading, setLoading] = useState(false);

  // Function that runs when the form is submitted
  const handleLogin = async (e: FormEvent) => {
    // Prevent the default form submission which would refresh the page
    e.preventDefault();
    // Clear any previous error messages
    setError("");
    // Show loading state while we wait for the server
    setLoading(true);

    try {
      // Send login request to the backend API
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        // Tell the server we're sending JSON data
        headers: { "Content-Type": "application/json" },
        // Convert our email and password to JSON format
        body: JSON.stringify({ email, password }),
      });

      // Check if the server responded with success (status 200-299)
      if (res.ok) {
        // Parse the JSON response from the server
        const data = await res.json();
        // Store the access token in localStorage for future API requests
        localStorage.setItem("token", data.access_token);
        // Store the refresh token for getting new access tokens when they expire
        localStorage.setItem("refresh_token", data.refresh_token);
        // Store the full user object for easy access throughout the app
        localStorage.setItem("user", JSON.stringify(data.user));

        // Call the parent component's callback with the user data
        // This tells App.tsx that login was successful
        onLogin({
          id: data.user.id,
          username: data.user.username,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          email: data.user.email,
          token: data.access_token
        });
      } else {
        // Login failed - parse the error message from the server
        const errorData = await res.json();
        // Display the error message, or a default message if none provided
        setError(errorData.detail || "Invalid email or password");
      }
    } catch (err) {
      // Network error or server is down - log it and show user-friendly message
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      // Always turn off loading state when done, whether success or failure
      setLoading(false);
    }
  };

  return (
    // Login form container with inline styles for positioning and appearance
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        // Center the form both horizontally and vertically
        transform: "translate(-50%, -50%)",
        padding: "2rem",
        width: "300px",
        backgroundColor: "#fff",
        // Add shadow for depth effect
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        borderRadius: "10px",
        textAlign: "center",
        // Make sure form appears above other elements
        zIndex: 1000,
      }}
    >
      {/* Form title */}
      <h3>Login</h3>
      {/* Show error message in red if there is one */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {/* Form element - onSubmit triggers our handleLogin function */}
      <form onSubmit={handleLogin}>
        {/* Email input field */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          // Update state when user types
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          // Browser will validate that email format is correct
          required
        />
        {/* Password input field */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          // Update state when user types
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          required
        />
        {/* Submit button - disabled while loading to prevent double-clicks */}
        <button
          type="submit"
          style={{ width: "100%", padding: "8px" }}
          disabled={loading}
        >
          {/* Show different text based on loading state */}
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

// Export the component so it can be imported in other files
export default Login;
