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
  // Optional task passed from parent when user selects "Agent Chat" from task menu
  taskName?: {
    id: number;
    title: string;
  } | null;
  // Callback to close the task menu when chat is opened
  onCloseTaskMenu?: () => void;
}

// Define the chat mode types
type ChatMode = 'APP_GUIDE' | 'TASK';

const UnifiedChat: React.FC<UnifiedChatProps> = ({ user, taskName, onCloseTaskMenu }) => {
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

  // Handle when a task is selected from the dashboard menu
  // This opens the chat window and switches to TASK mode
  useEffect(() => {
    if (taskName && taskName.id) {
      const taskId = taskName.id.toString();
      setCurrentTaskId(taskId);
      setCurrentTaskTitle(taskName.title);
      setMode('TASK');

      // Clear previous messages when switching to task mode
      setMessages([
        {
          sender: "agent",
          text: `Hi ${user.first_name || user.username}! How can I help with "${taskName.title}"?`
        }
      ]);

      // Auto-open the chat window when a task is selected
      setIsOpen(true);
      // Close the task menu if provided
      if (onCloseTaskMenu) onCloseTaskMenu();
    }
  }, [taskName, user.first_name, user.username, onCloseTaskMenu]);

  // Fetch all tasks when the component mounts or when token changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Get list of tasks from the API
        const response = await api.get('/tasks/');
        setTasks(response.data);

        // If no task was passed as prop and we're in TASK mode, try to restore selected task
        if (mode === 'TASK' && !currentTaskId) {
          const taskId = localStorage.getItem('selectedTaskId') || '';
          if (taskId) {
            const task = response.data.find((t: Task) => t.id.toString() === taskId);
            if (task) {
              setCurrentTaskId(taskId);
              setCurrentTaskTitle(task.title);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    // Only fetch if we have a valid token
    if (user.token) fetchTasks();
  }, [user.token, mode, currentTaskId]);

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
    } else if (mode === 'TASK' && currentTaskTitle) {
      // Set task-specific messages when switching to task mode
      setMessages([
        {
          sender: "agent",
          text: `Hi ${user.first_name || user.username}! How can I help with "${currentTaskTitle}"?`
        }
      ]);
    } else if (mode === 'TASK' && !currentTaskTitle && tasks.length > 0) {
      // If switching to task mode but no task is selected, use the first task
      const firstTask = tasks[0];
      setCurrentTaskId(firstTask.id.toString());
      setCurrentTaskTitle(firstTask.title);
      localStorage.setItem('selectedTaskId', firstTask.id.toString());

      setMessages([
        {
          sender: "agent",
          text: `Hi ${user.first_name || user.username}! How can I help with "${firstTask.title}"?`
        }
      ]);
    }
  }, [mode, currentTaskTitle, user.first_name, user.username, tasks]);

  // Handle when user selects a different task from the dropdown (only applicable in TASK mode)
  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId) {
      const task = tasks.find(t => t.id.toString() === newId);
      if (task) {
        setCurrentTaskId(newId);
        setCurrentTaskTitle(task.title);
        localStorage.setItem('selectedTaskId', newId);

        // Reset messages for the new task
        setMessages([
          {
            sender: "agent",
            text: `Hi ${user.first_name || user.username}! How can I help with "${task.title}"?`
          }
        ]);
      }
    } else {
      setCurrentTaskId('');
      setCurrentTaskTitle('');
      localStorage.removeItem('selectedTaskId');
    }
  };

  // Handle opening the chat in APP_GUIDE mode (default behavior)
  const openAppGuideMode = () => {
    setMode('APP_GUIDE');
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
        response = await api.post('/tasks/app-guide/chat', {
          message: currentInput
        });
      } else { // TASK mode
        // Don't send if no task is selected
        if (!currentTaskId) {
          throw new Error("No task selected");
        }
        // Call the task-specific endpoint
        response = await api.post(`/tasks/${currentTaskId}/chat`, {
          message: currentInput
        });
      }

      const data = response.data;
      // Create agent message from the response
      const agentMsg = {
        sender: "agent",
        text: data.response || data.message || "I'm here to help!"
      };
      // Add agent response to conversation
      const finalHistory = [...tempHistory, agentMsg];
      setMessages(finalHistory);
    } catch (err) {
      // Handle errors - show error message in chat
      console.error("CHAT ERROR:", err);
      const errorMsg = {
        sender: "agent",
        text: "Connection error. Is the backend running?"
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
      {/* Chat header with mode and task selector - only shown when chat is open */}
      {isOpen && (
        <div className="chat-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px',
          background: mode === 'APP_GUIDE' ? '#28a745' : '#007bff',
          color: 'white'
        }}>
          <span>
            {getHeaderTitle()}
          </span>
          {/* Task dropdown selector - only show in TASK mode if we have tasks */}
          {mode === 'TASK' && tasks.length > 0 && (
            <select
              value={currentTaskId}
              onChange={handleTaskChange}
              style={{ marginLeft: '10px', background: 'white', color: 'black', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="">Select Task</option>
              {/* Map through all tasks to create dropdown options */}
              {tasks.map(task => (
                <option key={task.id} value={task.id.toString()}>
                  {task.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {/* Floating action button to toggle chat open/closed - always opens in App Guide mode when closed */}
      <button
        className="unified-chat-fab"
        onClick={isOpen ? () => setIsOpen(false) : openAppGuideMode}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: mode === 'APP_GUIDE' ? '#28a745' : '#007bff',
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}
        title={isOpen ? "Close chat" : "Open App Assistant (General Help)"}
      >
        {/* Show X when open, robot icon when closed (always opens in App Guide mode) */}
        {isOpen ? "×" : "🤖"}
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
            {/* Mode toggle button - allows switching between modes */}
            <button
              onClick={() => {
                if (mode === 'APP_GUIDE') {
                  setMode('TASK');
                  // If there are tasks, select the first one
                  if (tasks.length > 0 && !currentTaskId) {
                    const firstTask = tasks[0];
                    setCurrentTaskId(firstTask.id.toString());
                    setCurrentTaskTitle(firstTask.title);
                    localStorage.setItem('selectedTaskId', firstTask.id.toString());
                  }
                } else {
                  setMode('APP_GUIDE');
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