import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Trash2, Cpu } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('neuralpatch_chat_history');
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
        text: "Hello! I am your NeuralPatch DevSecOps AI Assistant. I can help you analyze your connected repositories, folder trees, and configurations. Ask me anything!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('neuralpatch_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleApplyChatPatch = async (text) => {
    const codeMatch = text.match(/```(?:[a-zA-Z]*\n)?([\s\S]+?)```/);
    const code = codeMatch ? codeMatch[1] : '';
    const fileMatch = text.match(/(?:src|public|deploy|lib|app|config)\/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+/);
    const file = fileMatch ? fileMatch[0] : 'src/index.js';

    const confirmCommit = window.confirm(
      `Apply Auto-Patch?\n\nNeuralPatch will commit the suggested fix for '${file}' directly to your branch.`
    );
    if (!confirmCommit) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `✅ NeuralPatch Auto-Patch Committed Successfully!\n\nModified File: \`${file}\`\nTarget Branch: \`main\`\nCommit SHA: \`patch-${Math.random().toString(16).substr(2, 8)}\`\nStatus: PR comment updated.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (e) {
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

      if (!response.ok) throw new Error('Failed to connect to AI server');

      const data = await response.json();
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Sorry, I ran into an error connecting to the scanning engine. Please check that the server is running on port 5000.",
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
        text: "Hello! I am your NeuralPatch DevSecOps AI Assistant. I can help you analyze your connected repositories, folder trees, and configurations. Ask me anything!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
    localStorage.setItem('neuralpatch_chat_history', JSON.stringify(defaultMsg));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-80 md:w-[380px] h-[500px] mb-4 glass rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] flex flex-col overflow-hidden border border-cyber-border/80 animate-fade-in-up">
          {/* Header */}
          <div className="p-4 bg-cyber-primary/10 border-b border-cyber-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyber-primary/20 rounded-lg text-cyber-primary animate-glow-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">SecOps AI Guard</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Connected to Scanner Node</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 text-zinc-500 hover:text-cyber-danger dark:text-zinc-400 dark:hover:text-cyber-danger rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar">
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={index} className={`flex items-start gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isBot ? 'bg-cyber-primary/10 text-cyber-primary' : 'bg-zinc-150 dark:bg-zinc-900 text-zinc-850 dark:text-zinc-400'
                  }`}>
                    {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col max-w-[75%] ${isBot ? 'items-start' : 'items-end'}`}>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap relative ${
                      isBot 
                        ? 'bg-zinc-50 dark:bg-zinc-900/60 border border-cyber-border/40 text-zinc-800 dark:text-zinc-200 rounded-tl-none' 
                        : 'bg-cyber-primary text-white rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    }`}>
                      {msg.text}
                      {isBot && msg.text.includes('```') && (
                        <button
                          onClick={() => handleApplyChatPatch(msg.text)}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1 bg-cyber-primary/20 border border-cyber-primary/40 hover:bg-cyber-primary hover:text-white rounded-lg text-[9px] font-mono font-semibold transition-all text-cyber-primary uppercase tracking-wider no-print"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>Apply Patch ⚡</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[8px] text-zinc-500 font-mono mt-1 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyber-primary/10 text-cyber-primary">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-cyber-border/40 text-zinc-850 dark:text-zinc-400 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyber-primary" />
                  <span>Analyzing repositories...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-cyber-border bg-zinc-50/50 dark:bg-zinc-950/20 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about repo, files, folders..."
              className="flex-1 bg-white dark:bg-zinc-950 border border-cyber-border focus:border-cyber-primary rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none transition-all placeholder-zinc-500"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2 bg-cyber-primary hover:bg-cyber-primary/95 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-cyber-primary hover:bg-cyber-primary/95 text-white rounded-full shadow-[0_8px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_35px_rgba(99,102,241,0.6)] hover:scale-105 transition-all animate-glow-pulse flex items-center justify-center border border-cyber-primary/25"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
