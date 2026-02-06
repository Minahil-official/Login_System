// main.tsx - The entry point for the React application
// This file initializes React and mounts the App component to the DOM

// Import React library for JSX support
import React from "react";
// Import ReactDOM for rendering React components to the browser DOM
import ReactDOM from "react-dom/client";
// Import the root App component that contains the entire application
import App from "./App";
// Import global CSS styles that apply to the whole application
import "./index.css";

// Find the HTML element with id="root" and create a React root to render into it
// The "as HTMLElement" tells TypeScript we're sure this element exists
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Render the App component inside React.StrictMode
// StrictMode helps catch potential problems by running extra checks in development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
