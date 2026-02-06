// TasksPage.tsx - Task listing page component
// This page displays all user tasks in a card layout
// Includes logout functionality and a dropdown menu for task actions

// Import hooks for state management and navigation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import configured axios instance for API calls
import api from '../api/axios';

// Define the structure of a task object
interface Task {
  id: number;
  title: string;
  description: string;
}

// Define the TasksPage component
const TasksPage = () => {
  // Store the list of tasks fetched from the server
  const [tasks, setTasks] = useState<Task[]>([]);
  // Track loading state while fetching tasks
  const [loading, setLoading] = useState(true);
  // Store any error messages to display
  const [error, setError] = useState('');
  // Track which task's dropdown menu is currently open (null = none)
  const [showMenu, setShowMenu] = useState<number | null>(null);
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Fetch tasks when the component first mounts
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Make GET request to fetch all tasks
        const response = await api.get<Task[]>('/tasks');
        // Update state with fetched tasks
        setTasks(response.data);
      } catch (err: any) {
        // Display error message from server or generic fallback
        setError(err.response?.data?.detail || 'Failed to fetch tasks');
      } finally {
        // Turn off loading state when done
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Handle user logout
  const handleLogout = () => {
    // Remove the authentication token from localStorage
    localStorage.removeItem('token');
    // Navigate to auth page, replacing history so user can't go back
    navigate('/auth', { replace: true });
  };

  // Show loading state while fetching
  if (loading) return <div className="tasks-page"><h1>Loading tasks...</h1></div>;
  // Show error state if fetch failed
  if (error) return <div className="tasks-page"><h1>Error</h1><p>{error}</p></div>;

  return (
    // Main container with tasks-page class for styling
    <div className="tasks-page">
      {/* Page heading */}
      <h1>Your Tasks</h1>
      {/* Logout button */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
      {/* Task list container */}
      <div className="tasks-list">
        {/* Show message if no tasks exist */}
        {tasks.length === 0 ? (
          <p>No tasks yet. Create one through the backend or chat.</p>
        ) : (
          // Map through tasks and render each as a card
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              {/* Task title */}
              <h3>{task.title}</h3>
              {/* Task description */}
              <p>{task.description}</p>
              {/* Actions container */}
              <div style={{ marginTop: '10px' }}>
              {/* Dropdown menu wrapper with relative positioning */}
              <div className="task-actions" style={{ position: 'relative' }}>
                {/* Three dots button to toggle dropdown menu */}
                <button
                  className="dots-menu"
                  onClick={() => setShowMenu(showMenu === task.id ? null : task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ⋮
                </button>
                {/* Dropdown menu - only shown when this task's menu is active */}
                {showMenu === task.id && (
                  <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',  /* Position below the button */
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '150px'
                  }}>
                    {/* Agent Chat menu option */}
                    <button
                      className="menu-item"
                      onClick={() => {
                        // Close the dropdown menu
                        setShowMenu(null);
                        // Save selected task ID for the chat component
                        localStorage.setItem('selectedTaskId', task.id.toString());
                        // Note: Agent chat opening logic would be handled elsewhere
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      Agent Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Export the component for use in routing
export default TasksPage;
