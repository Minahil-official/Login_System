// TaskChatPage.tsx - Full-page chat interface for task-specific AI conversations
// This page provides a dedicated chat experience for interacting with an AI agent
// Messages are persisted in localStorage for the session

// Import hooks for state management, refs, and routing
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
// Import configured axios instance for API calls
import api from '../api/axios';

// Define the structure of a chat message
interface Message {
  role: 'user' | 'agent';  // Who sent the message
  content: string;         // The message text
  timestamp?: string;      // When the message was sent
  agentName?: string;      // Name of the agent (for agent messages)
}

// Define the expected response format from the chat API
interface ChatResponse {
  response: string;      // The agent's response text
  agent_name: string;    // Name of the responding agent
  timestamp: string;     // Server timestamp
}

// Define the TaskChatPage component
const TaskChatPage = () => {
  // Get the taskId from the URL parameters (e.g., /tasks/123/chat)
  const { taskId } = useParams() as { taskId: string };
  // Store all messages in the conversation
  const [messages, setMessages] = useState<Message[]>([]);
  // Store the current text in the input field
  const [input, setInput] = useState('');
  // Track if we're waiting for an agent response
  const [loading, setLoading] = useState(false);
  // Ref to the bottom of messages for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load any previously saved messages from localStorage when component mounts
  useEffect(() => {
    if (taskId) {
      // Try to get saved messages for this specific task
      const savedMessages = localStorage.getItem(`chat_${taskId}`);
      if (savedMessages) {
        // Parse and restore the messages
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [taskId]);

  // Save messages to localStorage whenever they change
  // This provides persistence across page refreshes
  useEffect(() => {
    if (taskId && messages.length > 0) {
      localStorage.setItem(`chat_${taskId}`, JSON.stringify(messages));
    }
  }, [messages, taskId]);

  // Function to scroll chat to the bottom (shows latest messages)
  const scrollToBottom = () => {
    // Use smooth scrolling for better UX
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll whenever messages change
  useEffect(scrollToBottom, [messages]);

  // Handle sending a message to the AI agent
  const sendMessage = async () => {
    // Don't send if input is empty, no task selected, or already loading
    if (!input.trim() || !taskId || loading) return;

    // Create the user message object
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    // Add user message to the conversation immediately
    setMessages((prev) => [...prev, userMessage]);
    // Save input value and clear the input field
    const messageContent = input;
    setInput('');
    // Show loading state
    setLoading(true);

    try {
      // Send the message to the backend API
      const response = await api.post<ChatResponse>(`/tasks/${taskId}/chat`, {
        message: messageContent,
      });

      // Create the agent message from the response
      const agentMessage: Message = {
        role: 'agent',
        content: response.data.response,
        agentName: response.data.agent_name,
        timestamp: response.data.timestamp,
      };

      // Add agent response to the conversation
      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      // Handle errors by showing an error message in the chat
      const errorMessage: Message = {
        role: 'agent',
        content: `Error: ${err.response?.data?.detail || 'Failed to get response from agent'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Always turn off loading state
      setLoading(false);
    }
  };

  return (
    // Main chat container - full height layout
    <div className="chat-container">
      {/* Header with back navigation */}
      <header className="chat-header">
        {/* Link back to tasks list */}
        <Link to="/tasks" className="back-link">
          ← Back to Tasks
        </Link>
      </header>
      {/* Message display area */}
      <div className="chat-messages">
        {/* Render each message in the conversation */}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {/* Show agent name label for agent messages */}
            {message.role === 'agent' && message.agentName && (
              <div className="agent-name">{message.agentName}</div>
            )}
            {/* Message content bubble */}
            <div className="message-content">{message.content}</div>
            {/* Timestamp display */}
            {message.timestamp && (
              <div className="timestamp">
                {/* Format the timestamp for display */}
                {new Date(message.timestamp).toLocaleString()}
              </div>
            )}
          </div>
        ))}
        {/* Show typing indicator while waiting for response */}
        {loading && (
          <div className="message agent">
            <div className="message-content loading">Agent is typing...</div>
          </div>
        )}
        {/* Invisible element at the bottom for scrolling to */}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area for typing messages */}
      <div className="chat-input-area">
        {/* Text input field */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Send message when Enter is pressed (without Shift for multi-line)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();  // Prevent newline
              sendMessage();
            }
          }}
          placeholder="Type your message to the agent..."
          disabled={loading}  // Disable while waiting for response
        />
        {/* Send button - disabled when loading or input is empty */}
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

// Export the component for use in routing
export default TaskChatPage;
