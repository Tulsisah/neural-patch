import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Loader2, ShieldCheck, Sparkles, Trash2, Cpu } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../hooks/useAuth';

export default function Chat() {
  const { user } = useAuth();
  const storageKey = `neuralpatch_chat_history_${user?.email || 'guest'}`;

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        sender: 'bot',
        text: "Welcome to the NeuralPatch AI Chat Terminal. I am your SecOps audit assistant. Ask me questions about your connected codebases, configuration files, or vulnerabilities.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleApplyChatPatch = async (text) => {
    const codeBlocks = [...text.matchAll(/```(?:[a-zA-Z]*\n)?([\s\S]+?)```/g)];
    const code = codeBlocks.length > 0 ? codeBlocks[codeBlocks.length - 1][1] : '';
    const fileMatch = text.match(/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+/);
    const file = fileMatch ? fileMatch[0] : 'src/index.js';

    const confirmCommit = window.confirm(
      `Apply Auto-Patch?\n\nNeuralPatch will commit the suggested fix for '${file}' directly to your branch.`
    );
    if (!confirmCommit) return;

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('neuralpatch_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/chat/patch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ file, code })
      });
      
      if (!response.ok) {
        throw new Error('API failed');
      }
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `✅ NeuralPatch Auto-Patch Committed Successfully!\n\nModified File: \`${file}\`\nTarget Branch: \`main\`\nCommit SHA: \`${data.commitSha || 'patch-success'}\`\nStatus: ${data.message || 'PR comment updated.'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (e) {
      console.error("Patch error:", e);
      alert("Failed to apply patch.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = {
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('neuralpatch_token');
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ message: userMsg.text })
      });

      if (!response.ok) throw new Error('Server connection failed');

      const data = await response.json();
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Could not retrieve response from the DevSecOps scanning backend. Please check your network or server status.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const confirmClear = window.confirm("Clear all chat history?");
    if (!confirmClear) return;
    const defaultMsg = [
      {
        sender: 'bot',
        text: "Welcome to the NeuralPatch AI Chat Terminal. I am your SecOps audit assistant. Ask me questions about your connected codebases, configuration files, or vulnerabilities.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
    localStorage.setItem(storageKey, JSON.stringify(defaultMsg));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">AI Security Assistant</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Query your project structure, inspect folders, and discuss mitigation strategies.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl text-cyber-primary text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Interactive Audit</span>
        </div>
      </div>

      {/* Main Terminal Frame */}
      <div className="flex-1 glass rounded-2xl border border-cyber-border overflow-hidden flex flex-col min-h-0">
        {/* Sub-header */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyber-success animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">SecOps Terminal Session Active</span>
          </div>
          <button 
            onClick={handleClearChat}
            title="Clear Chat History"
            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-cyber-danger transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Terminal</span>
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 scrollbar">
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';
            return (
              <div key={index} className={`flex items-start gap-4 ${isBot ? '' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`p-2 rounded-xl shrink-0 ${
                  isBot ? 'bg-cyber-primary/10 text-cyber-primary' : 'bg-zinc-150 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[80%] ${isBot ? 'items-start' : 'items-end'}`}>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isBot 
                      ? 'bg-zinc-50/70 dark:bg-zinc-900/40 border border-cyber-border/40 text-zinc-800 dark:text-zinc-200 rounded-tl-none' 
                      : 'bg-cyber-primary text-white rounded-tr-none shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                  }`}>
                    {msg.text}
                    {isBot && msg.text.includes('```') && (
                      <button
                        onClick={() => handleApplyChatPatch(msg.text)}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-cyber-primary/20 border border-cyber-primary/40 hover:bg-cyber-primary hover:text-white rounded-xl text-[10px] font-mono font-semibold transition-all text-cyber-primary uppercase tracking-wider no-print"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Apply Suggested Patch ⚡</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono mt-1 px-1.5">{msg.time}</span>
                </div>
              </div>
            );
          })}

          {/* Loading dot */}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-cyber-primary/10 text-cyber-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-zinc-50/70 dark:bg-zinc-900/40 border border-cyber-border/40 text-zinc-500 rounded-2xl rounded-tl-none flex items-center gap-2.5 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-cyber-primary" />
                <span>Auditing active repos...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-cyber-border bg-zinc-50/50 dark:bg-zinc-950/20 flex gap-3">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Search folders, list connected repositories, check for vulnerabilities..."
            className="flex-1 bg-white dark:bg-zinc-950 border border-cyber-border focus:border-cyber-primary rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white focus:outline-none transition-all placeholder-zinc-500"
          />
          <button 
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-5 bg-cyber-primary hover:bg-cyber-primary/95 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
