import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import ScanDetails from './pages/ScanDetails';
import VulnerabilityFeed from './pages/VulnerabilityFeed';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Chat from './pages/Chat';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GithubCallback from './pages/GithubCallback';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="bg-cyber-bg min-h-screen text-zinc-150">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/github/callback" element={<GithubCallback />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cyber-bg text-zinc-800 dark:text-zinc-150 transition-colors duration-200">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-cyber-bg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/scans/feed" element={<VulnerabilityFeed />} />
            <Route path="/scans/:id" element={<ScanDetails />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
