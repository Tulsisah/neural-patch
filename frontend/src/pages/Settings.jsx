import React, { useState } from 'react';
import { Shield, Key, Cpu, Bell, ShieldAlert, Save, Check } from 'lucide-react';

export default function Settings() {
  const [selectedModel, setSelectedModel] = useState(() => {
    return sessionStorage.getItem('neuralpatch_ai_model') || 'gemini-2.5-flash';
  });
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return sessionStorage.getItem('neuralpatch_webhook_url') || 'https://api.neuralpatch.io/webhooks/github';
  });
  const [githubToken, setGithubToken] = useState(() => {
    return sessionStorage.getItem('neuralpatch_github_token') || '';
  });
  const [creativity, setCreativity] = useState(() => {
    return sessionStorage.getItem('neuralpatch_creativity') || '15';
  });
  const [blockCritical, setBlockCritical] = useState(() => {
    return sessionStorage.getItem('neuralpatch_block_critical') !== 'false';
  });
  const [blockHigh, setBlockHigh] = useState(() => {
    return sessionStorage.getItem('neuralpatch_block_high') !== 'false';
  });
  const [blockMedium, setBlockMedium] = useState(() => {
    return sessionStorage.getItem('neuralpatch_block_medium') === 'true';
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Use sessionStorage instead of localStorage to mitigate XSS persistence risks
    sessionStorage.setItem('neuralpatch_github_token', githubToken);
    sessionStorage.setItem('neuralpatch_ai_model', selectedModel);
    sessionStorage.setItem('neuralpatch_webhook_url', webhookUrl);
    sessionStorage.setItem('neuralpatch_creativity', creativity);
    sessionStorage.setItem('neuralpatch_block_critical', blockCritical);
    sessionStorage.setItem('neuralpatch_block_high', blockHigh);
    sessionStorage.setItem('neuralpatch_block_medium', blockMedium);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Security Configurations</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure scanner models, API triggers, webhooks, and security levels.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Settings */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <Cpu className="w-4 h-4 text-cyber-primary" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">AI Audit Engine</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Default Scanner Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 focus:border-cyber-primary rounded-xl px-3 py-2.5 text-xs text-zinc-800 dark:text-white focus:outline-none transition-all"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Precise)</option>
                  <option value="llama-3-70b-groq">Llama 3 70B (Groq Fast)</option>
                  <option value="mixtral-8x7b-groq">Mixtral 8x7B (Groq Open Source)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Scanner Creativity (Temperature: {creativity}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={creativity}
                  onChange={(e) => setCreativity(e.target.value)}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyber-primary mt-4"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                  <span>Deterministic (0.1)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Integration Settings */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <Key className="w-4 h-4 text-cyber-primary" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">GitHub Integration & Webhooks</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">GitHub Personal Access Token (PAT)</label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-cyber-primary rounded-xl px-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 focus:outline-none transition-all font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Provide a token with <code>repo</code> scope to sync real GitHub repositories and apply automated security patches.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Payload Webhook URL</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-cyber-primary rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-300 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Webhook Secret Key</label>
                  <input
                    type="password"
                    value="••••••••••••••••••••••••"
                    disabled
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">GitHub App Identifier</label>
                  <input
                    type="text"
                    value="app_id_90382"
                    disabled
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Warnings & Actions */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-cyber-danger" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Compliance Threshold</h3>
            </div>
            
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              Block merge request integrations if a PR receives audit findings exceeding:
            </p>

            <div className="space-y-3">
                <label className="flex items-center gap-3 text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={blockCritical} 
                    onChange={(e) => setBlockCritical(e.target.checked)} 
                    className="rounded border-zinc-300 dark:border-zinc-800 text-cyber-primary focus:ring-0 bg-white dark:bg-zinc-950 w-4 h-4" 
                  />
                  <span>Critical Vulnerabilities</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={blockHigh} 
                    onChange={(e) => setBlockHigh(e.target.checked)} 
                    className="rounded border-zinc-300 dark:border-zinc-800 text-cyber-primary focus:ring-0 bg-white dark:bg-zinc-950 w-4 h-4" 
                  />
                  <span>High Vulnerabilities</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={blockMedium} 
                    onChange={(e) => setBlockMedium(e.target.checked)} 
                    className="rounded border-zinc-300 dark:border-zinc-800 text-cyber-primary focus:ring-0 bg-white dark:bg-zinc-950 w-4 h-4" 
                  />
                  <span>Medium/Low findings (Allow warnings)</span>
                </label>
            </div>
          </div>

          {/* Action buttons */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-cyber-primary hover:bg-cyber-primary/95 text-white rounded-2xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Configuration Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
