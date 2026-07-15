import React, { createContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from sessionStorage
    const savedToken = sessionStorage.getItem('neuralpatch_token');
    const savedUser = sessionStorage.getItem('neuralpatch_user');
    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem('neuralpatch_token');
        sessionStorage.removeItem('neuralpatch_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : 'Login failed');
        throw new Error(errorMsg);
      }
      setToken(data.token);
      setUser(data.user);
      sessionStorage.setItem('neuralpatch_token', data.token);
      sessionStorage.setItem('neuralpatch_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('neuralpatch_token');
    sessionStorage.removeItem('neuralpatch_user');
    sessionStorage.removeItem('neuralpatch_chat_history');
    sessionStorage.removeItem('neuralpatch_github_token');
    localStorage.removeItem('neuralpatch_token');
    localStorage.removeItem('neuralpatch_github_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
