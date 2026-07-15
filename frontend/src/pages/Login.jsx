import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Github, ArrowRight, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    const result = await login(email, password);
    if (!result.success) {
      setLoginError(result.error || 'Login failed. Please check your credentials.');
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleGithubLogin = () => {
    setIsGithubLoading(true);
    // Redirect to backend GitHub OAuth authorization URL
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (clientId) {
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('oauth_state', state);
      const redirectUri = encodeURIComponent(`${window.location.origin}/github/callback`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user&state=${state}`;
    } else {
      setLoginError('GitHub OAuth is not configured. Please use email login.');
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-success/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full glass p-8 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.1)] relative z-10 border border-cyber-border/80">
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-2xl text-cyber-primary mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-glow-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Welcome to NeuralPatch
          </h2>
          <p className="text-xs text-zinc-500 mt-1.5 max-w-[280px]">
            AI-powered threat scanner & automated patch engineering platform.
          </p>
        </div>

        {/* GitHub OAuth Button */}
        <button
          onClick={handleGithubLogin}
          disabled={isLoading || isGithubLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-950 py-3 rounded-2xl text-sm font-bold transition-all shadow-md active:scale-[0.98]"
        >
          {isGithubLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
          ) : (
            <Github className="w-4 h-4 text-zinc-950 fill-zinc-950" />
          )}
          <span>Continue with GitHub</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-zinc-800" />
          <span className="text-[10px] text-zinc-500 font-mono px-3 uppercase tracking-widest">or sandbox sign-in</span>
          <div className="flex-1 h-[1px] bg-zinc-800" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyber-primary rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              placeholder="Email Address"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-cyber-primary rounded-2xl pl-11 pr-11 py-3 text-xs text-white placeholder-zinc-550 focus:outline-none transition-all"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-[10px] text-zinc-400 hover:text-white transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGithubLoading}
            className="w-full flex items-center justify-center gap-2 bg-cyber-primary hover:bg-cyber-primary/95 text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {loginError && (
            <p className="text-xs text-red-500 text-center mt-2 font-mono">{loginError}</p>
          )}
        </form>

        <p className="text-[10px] text-center text-zinc-550 font-mono mt-6">
          Secured with SHA-256 and cryptographic token assertions.
        </p>
      </div>
    </div>
  );
}
