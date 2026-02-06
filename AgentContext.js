import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const AgentContext = createContext();

// 2. Create a provider component
export const AgentProvider = ({ children }) => {
  const [isAgentWindowOpen, setIsAgentWindowOpen] = useState(false);
  const [agentMode, setAgentMode] = useState(null); // 'general-purpose' | 'task-specific'
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]); // To store messages

  const openGeneralPurposeAgent = () => {
    setIsAgentWindowOpen(true);
    setAgentMode('general-purpose');
    setCurrentTaskId(null);
    setConversationHistory([]); // Clear history or load general purpose history
  };

  const openTaskSpecificAgent = (taskId) => {
    setIsAgentWindowOpen(true);
    setAgentMode('task-specific');
    setCurrentTaskId(taskId);
    setConversationHistory([]); // Clear history or load task-specific history
  };

  const closeAgentWindow = () => {
    setIsAgentWindowOpen(false);
    setAgentMode(null);
    setCurrentTaskId(null);
    setConversationHistory([]);
  };

  const addMessageToHistory = (message) => {
    setConversationHistory((prevHistory) => [...prevHistory, message]);
  };

  const contextValue = {
    isAgentWindowOpen,
    agentMode,
    currentTaskId,
    conversationHistory,
    openGeneralPurposeAgent,
    openTaskSpecificAgent,
    closeAgentWindow,
    addMessageToHistory,
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
};

// 3. Create a custom hook for easy consumption
export const useAgent = () => {
  return useContext(AgentContext);
};
