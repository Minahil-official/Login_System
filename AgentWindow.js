import React, { useState } from 'react';
import { useAgent } from './AgentContext';

// Dummy Chat Input Component
const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={chatInputStyles.form}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
        style={chatInputStyles.input}
      />
      <button type="submit" style={chatInputStyles.button}>Send</button>
    </form>
  );
};

const chatInputStyles = {
  form: {
    display: 'flex',
    marginTop: 'auto',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
  },
  input: {
    flexGrow: 1,
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginRight: '10px',
  },
  button: {
    padding: '8px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

// Dummy Message Display Component
const MessageDisplay = ({ history }) => {
  return (
    <div style={messageDisplayStyles.container}>
      {history.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        history.map((msg, index) => (
          <div key={index} style={messageDisplayStyles.message}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))
      )}
    </div>
  );
};

const messageDisplayStyles = {
  container: {
    flexGrow: 1,
    overflowY: 'auto',
    marginBottom: '10px',
    border: '1px solid #eee',
    padding: '10px',
    borderRadius: '4px',
  },
  message: {
    marginBottom: '5px',
    backgroundColor: '#f9f9f9',
    padding: '5px',
    borderRadius: '3px',
  },
};

// --- Sub-components for each agent type ---
// You will move the actual UI and logic from your old agent windows into these.
const GeneralPurposeAgentUI = () => {
  const { addMessageToHistory, conversationHistory } = useAgent();

  const handleSendMessage = (message) => {
    addMessageToHistory({ sender: 'User', text: message });
    // In a real app, you'd send this to your backend's general purpose agent endpoint
    addMessageToHistory({ sender: 'Bot', text: `[GP Agent Response to: "${message}"]` });
  };

  return (
    <div style={agentUIStyles.container}>
      <h3 style={{ color: 'green' }}>🤖 General Purpose Agent</h3>
      <p>Hi ali! I'm here to help you understand how to use this application. Ask me about:</p>
      <ul>
        <li>How to create tasks</li>
        <li>How to use task agents</li>
        <li>App features and navigation</li>
        <li>Permissions and settings</li>
        <li>Any questions about the app!</li>
      </ul>
      <MessageDisplay history={conversationHistory} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

const TaskSpecificAgentUI = ({ taskId }) => {
  const { addMessageToHistory, conversationHistory } = useAgent();

  const handleSendMessage = (message) => {
    addMessageToHistory({ sender: 'User', text: message });
    // In a real app, you'd send this to your backend's task-specific agent endpoint with taskId
    addMessageToHistory({ sender: 'Bot', text: `[Task Agent Response for Task ${taskId} to: "${message}"]` });
  };

  return (
    <div style={agentUIStyles.container}>
      <h3 style={{ color: 'blue' }}>📊 Task Agent: Task #{taskId}</h3>
      <p>Focused on task ID: {taskId}. Here you can discuss details related to this specific task.</p>
      {/* You can add task details display here for the specific task */}
      <MessageDisplay history={conversationHistory} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

const agentUIStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
};

// --- The main unified Agent Window component ---
const AgentWindow = () => {
  const { isAgentWindowOpen, agentMode, currentTaskId, closeAgentWindow } = useAgent();

  if (!isAgentWindowOpen) {
    return null; // Don't render anything if the window is closed
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.header}>
          {agentMode === 'general-purpose' ? 'AI Agent Helper: App Guide Assistant' : `AI Agent Helper: Task ${currentTaskId}`}
          <button onClick={closeAgentWindow} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.agentContent}>
          {agentMode === 'general-purpose' && <GeneralPurposeAgentUI />}
          {agentMode === 'task-specific' && <TaskSpecificAgentUI taskId={currentTaskId} />}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'flex-end', // Align to bottom-right
    alignItems: 'flex-end',   // Align to bottom-right
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    width: '400px', // Adjust as needed
    height: '600px', // Adjust as needed
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    margin: '20px', // Offset from bottom/right
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2em',
    cursor: 'pointer',
    color: '#666',
  },
  agentContent: {
    flexGrow: 1,
    padding: '15px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
};

export default AgentWindow;
