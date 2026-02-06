// taskpopup.tsx - Main Dashboard component with task management
// This is the primary dashboard that users see after logging in
// It allows users to create, view, edit, and delete tasks

// Import React hooks for state management and side effects
import React, { useState, useEffect } from "react";
// Import the unified AI chat widget component
import UnifiedChat from "./UnifiedChat";
// Import component-specific styles
import "./taskpopup.css";
// Import configured axios instance for API calls
import api from "../api/axios";

// Define the structure of a task object from the API
interface Task {
  id: number;
  title: string;
  description?: string;  // Optional because not all tasks have descriptions
  status: string;
  created_at: string;
}

// Define the Dashboard component with typed props
const Dashboard: React.FC<{
  // User object passed from App.tsx containing all user details
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
  }
}> = ({ user }) => {
  // Store the list of tasks fetched from the server
  const [tasks, setTasks] = useState<Task[]>([]);
  // Track which task is currently being edited (null = none)
  const [editingId, setEditingId] = useState<number | null>(null);
  // Store the current value in the edit input field
  const [editValue, setEditValue] = useState("");
  // Track which task's kebab menu (three dots) is open
  const [activeKebab, setActiveKebab] = useState<number | null>(null);
  // Control visibility of the "create task" modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Store the title for a new task being created
  const [newTaskName, setNewTaskName] = useState("");
  // Store the description for a new task being created
  const [newTaskDescription, setNewTaskDescription] = useState("");
  // Track which task is selected for AI chat
  const [selectedTaskForAI, setSelectedTaskForAI] = useState<{id: number, title: string} | null>(null);
  // Track loading state while fetching tasks
  const [loading, setLoading] = useState(false);
  // Store any error messages to display
  const [error, setError] = useState("");
  // Control whether the task list is visible
  const [showTasks, setShowTasks] = useState(false);

  // Fetch tasks when the component first mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  // Function to fetch all tasks from the API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Make GET request to fetch tasks
      const response = await api.get("/tasks/");
      // Update state with fetched tasks
      setTasks(response.data);
      // Show the task list after successful fetch
      setShowTasks(true);
    } catch (err) {
      // Display error message if fetch fails
      setError("Failed to load tasks");
      console.error(err);
    } finally {
      // Always turn off loading state
      setLoading(false);
    }
  };

  // Toggle the task list visibility
  const toggleTasksView = () => {
    if (!showTasks) {
      // If tasks are hidden, fetch and show them
      fetchTasks();
    } else {
      // If tasks are visible, hide them
      setShowTasks(false);
    }
  };

  // Save changes when editing a task title
  const saveEdit = async (id: number) => {
    try {
      // Find the task we're editing to get its current description
      const taskToUpdate = tasks.find(t => t.id === id);
      if (!taskToUpdate) return;

      // Send PUT request to update the task
      await api.put(`/tasks/${id}`, {
        title: editValue,
        description: taskToUpdate.description
      });

      // Update local state with the new title
      setTasks(tasks.map(t => t.id === id ? { ...t, title: editValue } : t));
      // Close the edit mode
      setEditingId(null);
    } catch (err) {
      setError("Failed to update task");
      console.error(err);
    }
  };

  // Handle creating a new task
  const handleCreate = async () => {
    // Don't create if title is empty
    if (!newTaskName.trim()) return;

    try {
      // Send POST request to create new task
      const response = await api.post("/tasks/", {
        title: newTaskName,
        description: newTaskDescription
      });

      // Add the new task to our local state
      setTasks([...tasks, response.data]);
      // Clear the form fields
      setNewTaskName("");
      setNewTaskDescription("");
      // Close the create modal
      setIsCreateOpen(false);
    } catch (err) {
      setError("Failed to create task");
      console.error(err);
    }
  };

  // Handle deleting a task
  const handleDelete = async (id: number) => {
    try {
      // Send DELETE request to remove the task
      await api.delete(`/tasks/${id}`);
      // Remove the task from local state
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      setError("Failed to delete task");
      console.error(err);
    }
  };

  return (
    // Main dashboard container
    <div className="small-page">
      {/* Header section with welcome message and action buttons */}
      <div className="header-section">
        {/* Personalized welcome message using first name or username */}
        <h2>Welcome, {user.first_name || user.username}</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Button to open the create task modal */}
          <button className="submit-btn" onClick={() => setIsCreateOpen(true)}>+ Create Task</button>
          {/* Toggle button to show/hide task list */}
          <button
            className="submit-btn"
            onClick={toggleTasksView}
            style={{ background: showTasks ? "#dc3545" : "#28a745" }}
          >
            {showTasks ? "Hide Tasks" : "View Tasks"}
          </button>
        </div>
      </div>

      {/* Create Task Modal - only shown when isCreateOpen is true */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Task</h3>
            {/* Task title input */}
            <input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Enter task title..."
              style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            />
            {/* Task description textarea */}
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Enter task description..."
              style={{ width: "100%", padding: "8px", marginBottom: "10px", minHeight: "60px", resize: "vertical" }}
            />
            {/* Modal action buttons */}
            <div className="modal-actions">
              {/* Add button - disabled if no title entered */}
              <button className="submit-btn" onClick={handleCreate} disabled={!newTaskName.trim()}>Add</button>
              {/* Cancel button to close modal */}
              <button className="close-btn" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Display error message if there is one */}
      {error && <div style={{ color: "red", textAlign: "center", margin: "10px 0" }}>{error}</div>}
      {/* Display loading indicator while fetching tasks */}
      {loading && <div style={{ textAlign: "center", margin: "20px 0" }}>Loading tasks...</div>}

      {/* Task list - only shown when showTasks is true */}
      {showTasks && (
        <div className="task-list">
          {/* Show message if no tasks exist yet */}
          {tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No tasks yet. Click "Create Task" to add one!
            </div>
          ) : (
            // Map through all tasks and render each one
            tasks.map(task => (
          <div key={task.id} className="task-line">
            {/* Show edit input if this task is being edited */}
            {editingId === task.id ? (
              <div className="edit-box">
                {/* Edit input field */}
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                {/* Save button */}
                <button onClick={() => saveEdit(task.id)}>Save</button>
              </div>
            ) : (
              // Normal task display (not editing)
              <>
                {/* Task title */}
                <span style={{ fontWeight: "bold" }}>{task.title}</span>
                {/* Task description if it exists */}
                {task.description && (
                  <span style={{ fontSize: "0.9em", color: "#666", marginLeft: "10px" }}>
                    - {task.description}
                  </span>
                )}
                {/* Kebab menu (three dots) for task actions */}
                <div className="kebab-wrap">
                  {/* Toggle kebab menu visibility */}
                  <button className="kebab-btn" onClick={() => setActiveKebab(activeKebab === task.id ? null : task.id)}>⋮</button>
                  {/* Dropdown menu - only shown when this task's kebab is active */}
                  {activeKebab === task.id && (
                    <div className="dropdown">
                      {/* Edit option - enters edit mode for this task */}
                      <button
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px",
                          border: "none",
                          background: "#f0f0f0",
                          cursor: "pointer",
                          fontSize: "14px",
                          textAlign: "left"
                        }}
                        onClick={() => { setEditingId(task.id); setEditValue(task.title); setActiveKebab(null); }}
                      >
                        Edit
                      </button>
                      {/* Delete option - removes the task */}
                      <button
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px",
                          border: "none",
                          background: "#f0f0f0",
                          cursor: "pointer",
                          fontSize: "14px",
                          textAlign: "left",
                          color: "#dc3545"  // Red color to indicate destructive action
                        }}
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))
          )}
        </div>
      )}

      {/* Unified AI Chat component - supports both App Guide and Task modes */}
      <UnifiedChat
        user={user}
        taskName={selectedTaskForAI}
        onCloseTaskMenu={() => setActiveKebab(null)}
      />
    </div>
  );
};

// Export the component for use in App.tsx
export default Dashboard;
