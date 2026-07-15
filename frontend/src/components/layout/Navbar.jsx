import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Shield, LogOut, Bell, Github, Circle, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="h-16 glass border-b border-cyber-border/80 flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-200">
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="p-2 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg text-cyber-primary shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-glow-pulse">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-wide bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-550 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            NeuralPatch
          </span>
          <span className="text-[10px] text-cyber-primary font-mono tracking-widest uppercase">
            DevSecOps AI Guard
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {/* System Health Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-cyber-success/10 border border-cyber-success/20 rounded-full text-cyber-success text-xs font-medium">
          <Circle className="w-2.5 h-2.5 fill-cyber-success animate-pulse" />
          <span>Scanner Engine Online</span>
        </div>

        {/* Theme Toggle Switch */}
        <button 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all border border-transparent dark:hover:border-zinc-800"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all border border-transparent dark:hover:border-zinc-800">
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

        {/* Single Login/Logout Action Button */}
        {user ? (
          <button 
            onClick={logout} 
            title="Click to Logout"
            className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/80 border border-cyber-border hover:border-cyber-danger/30 hover:bg-cyber-danger/10 text-zinc-700 dark:text-zinc-300 dark:hover:text-cyber-danger rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <div className="w-5 h-5 rounded-full border border-cyber-primary/30 bg-cyber-primary/10 flex items-center justify-center text-cyber-primary text-[10px] font-bold font-mono">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span>Logout ({user.name})</span>
          </button>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-2 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/95 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          >
            <Github className="w-3.5 h-3.5 fill-white" />
            <span>Login as Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
