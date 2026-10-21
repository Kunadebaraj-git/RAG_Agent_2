import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DocumentsPage from './pages/DocumentsPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/documents" replace />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
      <Route path="/login" element={<Navigate to="/documents" replace />} />
      <Route path="/register" element={<Navigate to="/documents" replace />} />
      <Route path="*" element={<Navigate to="/documents" replace />} />
    </Routes>
  );
};

export default App;
