// UnifiedChat.tsx - Single chat window supporting both App Guide and Task modes
// This component consolidates both app guide and task-specific AI into one interface

import React, { useState, useEffect } from "react";
import api from '../api/axios';

interface Task {
  id: number;
  title: string;
  description: string;
}

interface UnifiedChatProps {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
  };
}

// Define the chat mode types
type ChatMode = 'APP_GUIDE' | 'TASK';

const UnifiedChat: React.FC<UnifiedChatProps> = ({ user }) => {
  // Track whether the chat window is open or closed
  const [isOpen, setIsOpen] = useState(false);
  // Track the current chat mode
  const [mode, setMode] = useState<ChatMode>('APP_GUIDE');
  // Store the messages for the current conversation
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  // Store the current text input value
  const [input, setInput] = useState("");
  // Track if we're waiting for an agent response
  const [isLoading, setIsLoading] = useState(false);
  // Store all available tasks fetched from the server
  const [tasks, setTasks] = useState<Task[]>([]);
  // Track which task is currently selected for chat (when in TASK mode)
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [currentTaskTitle, setCurrentTaskTitle] = useState<string>('');
  // Track if we're showing the task selection list
  const [showTaskList, setShowTaskList] = useState(false);

  // Clear all old chat history when component first loads
  useEffect(() => {
    // Find and remove all localStorage items that start with 'chat_'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chat_')) {
        localStorage.removeItem(key);
      }
    });
    // Start with empty messages
    setMessages([]);
  }, []);

  // Fetch all tasks when needed
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Get list of tasks from the API
        const response = await api.get('/tasks/');
        setTasks(response.data);
      } catch (error: any) {
        console.error('Failed to fetch tasks:', error);
        if (error.response?.status === 401) {
          // Token expired, clear and reload
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.reload();
        }
      }
    };
    // Fetch tasks when chat opens or when switching to task mode
    if (user.token && (isOpen || showTaskList)) {
      fetchTasks();
    }
  }, [user.token, isOpen, showTaskList]);

  // Handle mode switching - reset messages when switching modes
  useEffect(() => {
    if (mode === 'APP_GUIDE') {
      // Set app guide messages when switching to app guide mode
      setMessages([
        {
          sender: "agent",
          text: `Hi ${user.first_name || user.username}! I'm the App Assistant. I'm here to help you understand how to use this application. Ask me about:\n\n• How to create tasks\n• How to use task agents\n• App features and navigation\n• Permissions and settings\n• Any questions about the app!`
        }
      ]);
      setShowTaskList(false);
    } else if (mode === 'TASK' && currentTaskTitle) {
      // Set task-specific messages when switching to task mode
      setMessages([
        {
          sender: "agent",
          text: `Hi ${user.first_name || user.username}! How can I help with "${currentTaskTitle}"?`
        }
      ]);
      setShowTaskList(false);
    }
  }, [mode, currentTaskTitle, user.first_name, user.username]);

  // Handle when user selects a task from the task list
  const handleTaskSelect = (task: Task) => {
    setCurrentTaskId(task.id.toString());
    setCurrentTaskTitle(task.title);
    setMode('TASK');
    setShowTaskList(false);
    localStorage.setItem('selectedTaskId', task.id.toString());

    // Reset messages for the selected task
    setMessages([
      {
        sender: "agent",
        text: `Hi ${user.first_name || user.username}! How can I help with "${task.title}"?`
      }
    ]);
  };

  // Handle when user selects a different task from the dropdown (when already in TASK mode)
  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId) {
      const task = tasks.find(t => t.id.toString() === newId);
      if (task) {
        handleTaskSelect(task);
      }
    }
  };

  // Handle switching from APP_GUIDE to TASK mode - show task list
  const handleSwitchToTask = () => {
    setShowTaskList(true);
    // Fetch tasks if not already loaded
    if (tasks.length === 0) {
      api.get('/tasks/').then(response => {
        setTasks(response.data);
      }).catch(error => {
        console.error('Failed to fetch tasks:', error);
      });
    }
  };

  // Handle opening the chat in APP_GUIDE mode (default behavior)
  const openAppGuideMode = () => {
    setMode('APP_GUIDE');
    setShowTaskList(false);
    setIsOpen(true);
  };

  // Handle sending a message to the appropriate AI agent
  const handleSend = async () => {
    // Don't send empty messages
    if (!input.trim()) {
      setInput("");
      return;
    }

    // Save the input and clear the field immediately for better UX
    const currentInput = input;
    setInput("");
    // Create the user message object
    const userMsg = { sender: "user", text: currentInput };
    // Add user message to the conversation
    const tempHistory = [...messages, userMsg];
    setMessages(tempHistory);
    // Show loading state while waiting for response
    setIsLoading(true);

    try {
      let response;
      if (mode === 'APP_GUIDE') {
        // Call the app-guide endpoint (not task-specific)
        // Ensure message is not empty and is a string
        if (!currentInput || typeof currentInput !== 'string' || !currentInput.trim()) {
          throw new Error("Message cannot be empty");
        }
        
        // Check if token exists before making request
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No authentication token found. Please log in again.");
        }
        
        response = await api.post('/tasks/app-guide/chat', {
          message: currentInput.trim()
        });
      } else { // TASK mode
        // Don't send if no task is selected
        if (!currentTaskId) {
          throw new Error("No task selected");
        }
        // Call the task-specific endpoint
        response = await api.post(`/tasks/${currentTaskId}/chat`, {
          message: currentInput.trim()
        });
      }

      const data = response.data;
      // Create agent message from the response - check multiple possible response fields
      let responseText = "";
      if (typeof data === 'string') {
        responseText = data;
      } else if (data && typeof data === 'object') {
        responseText = data.response || data.message || data.text || JSON.stringify(data);
      } else {
        responseText = "I'm here to help!";
      }
      
      // Create agent message from the response
      const agentMsg = {
        sender: "agent",
        text: responseText || "I'm here to help!"
      };
      // Add agent response to conversation
      const finalHistory = [...tempHistory, agentMsg];
      setMessages(finalHistory);
    } catch (err: any) {
      // Handle errors - show error message in chat
      console.error("CHAT ERROR:", err);

      let errorMessage = "Connection error. Is the backend running?";
      if (err.response) {
        // Server responded with error status
        let errorDetail = 'Please try again.';
        if (typeof err.response.data === 'string') {
          errorDetail = err.response.data;
        } else if (err.response.data && typeof err.response.data === 'object') {
          // Handle FastAPI validation errors (422)
          if (err.response.status === 422 && err.response.data.detail) {
            // FastAPI validation errors are in detail array
            if (Array.isArray(err.response.data.detail)) {
              const validationErrors = err.response.data.detail.map((e: any) => {
                return `${e.loc?.join('.')}: ${e.msg}`;
              }).join(', ');
              errorDetail = `Validation error: ${validationErrors}`;
            } else {
              errorDetail = err.response.data.detail;
            }
          } else {
            // Try to get the detail field or convert the object to string
            errorDetail = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
          }
        }
        errorMessage = `Server error: ${err.response.status} - ${errorDetail}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Network error: Unable to connect to server. Please check your connection and ensure the backend is running.";
      } else {
        // Something else happened
        errorMessage = `Error: ${err.message || 'Please try again.'}`;
      }

      const errorMsg = {
        sender: "agent",
        text: errorMessage
      };
      const errorHistory = [...tempHistory, errorMsg];
      setMessages(errorHistory);
    } finally {
      // Always turn off loading state when done
      setIsLoading(false);
    }
  };

  // Determine the header title based on current mode
  const getHeaderTitle = () => {
    if (mode === 'APP_GUIDE') {
      return "App Assistant";
    } else { // TASK mode
      return currentTaskTitle ? `Task Assistant — ${currentTaskTitle}` : "Task Assistant";
    }
  };

  return (
    // Main container - positioned fixed in bottom right corner
    <div className="unified-chat-container" style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 1000
    }}>
      {/* Floating action button - General Purpose Agent (always green, always visible) */}
      <button
        className="unified-chat-fab"
        onClick={isOpen ? () => {
          setIsOpen(false);
          setMode('APP_GUIDE');
          setShowTaskList(false);
        } : openAppGuideMode}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: '#28a745', // Always green for General Purpose Agent
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(40, 167, 69, 0.4)",
          transition: "all 0.3s ease",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(40, 167, 69, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(40, 167, 69, 0.4)";
        }}
        title={isOpen ? "Close chat" : "General Purpose Agent - App Guide"}
      >
        {/* Show X when open, info icon when closed (General Purpose Agent) */}
        {isOpen ? "×" : "ℹ️"}
      </button>
      {/* Chat window - only shown when isOpen is true */}
      {isOpen && (
        <div className="unified-chat-window" style={{
          position: "absolute",
          bottom: "70px",
          right: "0",
          width: "350px",
          height: "500px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Chat window header with title */}
          <div className="unified-chat-header" style={{
            padding: "15px",
            background: mode === 'APP_GUIDE' ? '#28a745' : '#007bff',
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              {getHeaderTitle()}
            </div>
              {/* Mode toggle and task refresh controls */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {mode === 'TASK' && tasks.length > 1 && (
                <select
                  value={currentTaskId}
                  onChange={handleTaskChange}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Switch Task...</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id.toString()}>
                      {task.title}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={async () => {
                  // Refresh tasks list
                  try {
                    const response = await api.get('/tasks/');
                    setTasks(response.data);
                  } catch (error) {
                    console.error('Failed to refresh tasks:', error);
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Refresh tasks list"
              >
                ↻
              </button>
              <button
                onClick={() => {
                  if (mode === 'APP_GUIDE') {
                    handleSwitchToTask();
                  } else {
                    setMode('APP_GUIDE');
                    setCurrentTaskId('');
                    setCurrentTaskTitle('');
                    setShowTaskList(false);
                    localStorage.removeItem('selectedTaskId');
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {mode === 'APP_GUIDE' ? 'Switch to Task' : 'Switch to App Guide'}
              </button>
            </div>
          </div>
          {/* Task selection list - shown when switching from APP_GUIDE to TASK */}
          {showTaskList && (
            <div style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              <div style={{ 
                fontWeight: "bold", 
                marginBottom: "10px",
                color: mode === 'APP_GUIDE' ? '#28a745' : '#007bff'
              }}>
                Select a Task:
              </div>
              {tasks.length === 0 ? (
                <div style={{ 
                  padding: "10px", 
                  textAlign: "center", 
                  color: "#666",
                  fontStyle: "italic"
                }}>
                  No tasks available. Create a task first!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskSelect(task)}
                      style={{
                        padding: "10px 15px",
                        background: "#f0f0f0",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        fontSize: "14px"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e0e0e0";
                        e.currentTarget.style.borderColor = "#007bff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f0f0f0";
                        e.currentTarget.style.borderColor = "#ddd";
                      }}
                    >
                      <div style={{ fontWeight: "600" }}>{task.title}</div>
                      {task.description && (
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#666", 
                          marginTop: "4px" 
                        }}>
                          {task.description.substring(0, 50)}{task.description.length > 50 ? '...' : ''}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message display area - scrollable */}
          <div className="unified-chat-body" style={{
            flex: 1,
            padding: "15px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            {/* Render each message in the conversation */}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  // User messages align right, agent messages align left
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  // Different colors for user vs agent messages based on mode
                  background: m.sender === "user"
                    ? (mode === 'APP_GUIDE' ? "#28a745" : "#007bff")
                    : "#f0f0f0",
                  color: m.sender === "user" ? "white" : "black",
                  padding: "10px 15px",
                  borderRadius: "18px",
                  maxWidth: "80%",
                  wordWrap: "break-word"
                }}
              >
                {m.text}
              </div>
            ))}
            {/* Show typing indicator when waiting for agent response */}
            {isLoading && (
              <div style={{
                alignSelf: "flex-start",
                background: "#f0f0f0",
                padding: "10px 15px",
                borderRadius: "18px",
                fontStyle: "italic",
                color: "#666"
              }}>
                ...thinking
              </div>
            )}
          </div>
          {/* Input area for typing messages */}
          <div className="unified-chat-footer" style={{
            padding: "15px",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "10px"
          }}>
            {/* Text input field */}
            <input
              style={{
                flex: 1,
                padding: "10px 15px",
                border: "1px solid #ddd",
                borderRadius: "24px",
                outline: "none",
                fontSize: "14px"
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // Send message when Enter key is pressed
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                mode === 'APP_GUIDE'
                  ? "Ask about app features..."
                  : "Type message about this task..."
              }
              // Disable input while loading
              disabled={isLoading}
            />
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isLoading}
              style={{
                background: mode === 'APP_GUIDE' ? "#28a745" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "24px",
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedChat;