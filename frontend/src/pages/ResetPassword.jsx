import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setMessage('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-success/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full glass p-8 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.1)] relative z-10 border border-cyber-border/80">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-2xl text-cyber-primary mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-xs text-zinc-500 mt-1.5 max-w-[280px]">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyber-primary rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              placeholder="New Password"
              required
              minLength="6"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyber-primary rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              placeholder="Confirm New Password"
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || message}
            className="w-full flex items-center justify-center gap-2 bg-cyber-primary hover:bg-cyber-primary/95 text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          {message && (
            <p className="text-xs text-cyber-success text-center mt-2 font-mono">{message}</p>
          )}
          {error && (
            <p className="text-xs text-red-500 text-center mt-2 font-mono">{error}</p>
          )}
        </form>

        <div className="mt-6 flex justify-center">
          <Link to="/login" className="text-[11px] text-zinc-400 hover:text-white transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
