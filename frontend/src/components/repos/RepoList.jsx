import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Github, Play, CheckCircle, HelpCircle, ToggleLeft, ToggleRight, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function RepoList({ refreshKey }) {
  const scanTimeouts = useRef({});
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveRepos = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('neuralpatch_token') || localStorage.getItem('neuralpatch_token');
      
      const [dbRes, githubRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/repos`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) }
        }),
        fetch(`${API_BASE_URL}/api/github/repos`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) }
        })
      ]);

      if (!dbRes.ok || !githubRes.ok) throw new Error('API failed');
      
      const dbData = await dbRes.json();
      const githubData = await githubRes.json();
      
      const dbRepos = dbData.repos || [];
      const githubRepos = Array.isArray(githubData) ? githubData : [];

      const merged = githubRepos.map(ghRepo => {
        const active = dbRepos.find(r => r.name === ghRepo.name && r.owner === ghRepo.owner.login);
        if (active) {
          return {
            id: ghRepo.id.toString(),
            dbId: active._id,
            name: ghRepo.name,
            owner: ghRepo.owner.login,
            url: ghRepo.html_url,
            connected: true,
            autoPatch: active.isActive,
            health: active.healthScore || 100,
            lastScan: 'Just now',
            critical: 0,
            high: 0,
            scanning: false,
            scanCompleted: false
          };
        }
        return {
          id: ghRepo.id.toString(),
          name: ghRepo.name,
          owner: ghRepo.owner.login,
          url: ghRepo.html_url,
          connected: false,
          autoPatch: false,
          health: 0,
          lastScan: '-',
          critical: 0,
          high: 0,
          scanning: false,
          scanCompleted: false
        };
      });

      dbRepos.forEach(active => {
        if (!merged.some(m => m.name === active.name && m.owner === active.owner)) {
          merged.push({
            id: active._id,
            dbId: active._id,
            name: active.name,
            owner: active.owner,
            url: active.url,
            connected: true,
            autoPatch: active.isActive,
            lastScan: 'Just now',
            health: active.healthScore || 100,
            critical: 0,
            high: 0,
            scanning: false,
            scanCompleted: false
          });
        }
      });

      setRepos(merged);
    } catch (err) {
      console.warn("Could not load backend repos:", err);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRepos();
    return () => {
      Object.values(scanTimeouts.current).forEach(clearTimeout);
    };
  }, [refreshKey]);

  const handleToggleAutoPatch = async (repo) => {
    const nextVal = !repo.autoPatch;
    try {
      if (repo.dbId) {
        const token = localStorage.getItem('neuralpatch_token');
        const response = await fetch(`${API_BASE_URL}/api/repos/${repo.dbId}/auto-patch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ autoPatch: nextVal })
        });
        if (!response.ok) throw new Error('API failed');
      }
      setRepos(prev => prev.map(r => 
        r.id === repo.id ? { ...r, autoPatch: nextVal } : r
      ));
    } catch (e) {
      console.error("Failed to toggle auto-patch:", e);
      alert("Failed to toggle auto-patch. Please try again later.");
    }
  };

  const handleConnectToggle = async (repo) => {
    if (repo.connected) {
      const confirmDisconnect = window.confirm(`Disconnect ${repo.name}? Webhooks will be removed.`);
      if (!confirmDisconnect) return;

      try {
        if (repo.dbId) {
          const token = localStorage.getItem('neuralpatch_token');
          const response = await fetch(`${API_BASE_URL}/api/repos/${repo.dbId}`, {
            method: 'DELETE',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` })
            }
          });
          if (!response.ok) throw new Error('API failed');
        }
        fetchActiveRepos();
      } catch (err) {
        console.error("Failed to disconnect repository:", err);
        alert("Failed to disconnect repository. Check network connection.");
      }
    } else {
      try {
        const token = localStorage.getItem('neuralpatch_token');
        const response = await fetch(`${API_BASE_URL}/api/repos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            name: repo.name,
            owner: repo.owner,
            url: repo.url
          })
        });
        if (!response.ok) throw new Error('API failed');
        fetchActiveRepos();
      } catch (err) {
        console.error("Failed to connect repository:", err);
        alert("Failed to connect repository. Please try again.");
      }
    }
  };

  const handleScanNow = async (repo) => {
    if (repo.scanning) {
      if (scanTimeouts.current[repo.id]) {
        clearTimeout(scanTimeouts.current[repo.id]);
        delete scanTimeouts.current[repo.id];
      }
      setRepos(prev => prev.map(r => 
        r.id === repo.id ? { ...r, scanning: false } : r
      ));
      return;
    }

    setRepos(prev => prev.map(r => 
      r.id === repo.id ? { ...r, scanning: true } : r
    ));

    try {
      if (repo.dbId) {
        const token = localStorage.getItem('neuralpatch_token');
        const model = sessionStorage.getItem('neuralpatch_ai_model') || 'gemini-1.5-flash';
        const response = await fetch(`${API_BASE_URL}/api/scans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ repoId: repo.dbId, model })
        });
        if (!response.ok) throw new Error('API failed');
      }

      scanTimeouts.current[repo.id] = setTimeout(() => {
        setRepos(prev => prev.map(r => 
          r.id === repo.id ? { ...r, scanning: false, scanCompleted: true, lastScan: 'Just now', health: 100, critical: 0, high: 0 } : r
        ));
        delete scanTimeouts.current[repo.id];
      }, 3000);
    } catch (err) {
      console.error("Failed to trigger scan in database:", err);
      alert("Failed to trigger scan. Please try again.");
      setRepos(prev => prev.map(r => 
        r.id === repo.id ? { ...r, scanning: false } : r
      ));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {repos.map((repo) => (
        <div key={repo.id} className="glass glass-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          {repo.connected && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyber-primary/5 to-transparent blur-2xl pointer-events-none" />
          )}

          <div>
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                <span className="text-xs text-zinc-505 font-mono">{repo.owner} /</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                repo.connected 
                  ? 'bg-cyber-success/10 text-cyber-success border-cyber-success/20' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
              }`}>
                {repo.connected ? 'Active Guardian' : 'Inactive'}
              </span>
            </div>

            {/* Repo Name */}
            <div className="flex items-center gap-2 mt-2">
              <h4 className="font-bold text-lg text-zinc-900 dark:text-white group-hover:text-cyber-primary transition-colors tracking-tight">
                {repo.name}
              </h4>
              <a href={repo.url} target="_blank" rel="noreferrer" className="text-zinc-505 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Scanning specifications */}
            {repo.connected ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Security Health Index</span>
                  <span className={`font-bold font-mono ${
                    repo.health >= 90 ? 'text-cyber-success' : repo.health >= 75 ? 'text-cyber-warning' : 'text-cyber-danger'
                  }`}>
                    {repo.health}%
                  </span>
                </div>
                
                {/* Health indicator bar */}
                <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      repo.health >= 90 ? 'bg-cyber-success' : repo.health >= 75 ? 'bg-cyber-warning' : 'bg-cyber-danger'
                    }`} 
                    style={{ width: `${repo.health}%` }}
                  />
                </div>

                {/* Threat findings */}
                <div className="flex items-center gap-4 text-[10px] font-mono mt-2">
                  <span className="text-zinc-505">Last scan: {repo.lastScan}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    {repo.critical > 0 && <span className="text-cyber-danger bg-cyber-danger/10 border border-cyber-danger/20 px-1.5 py-0.5 rounded">C: {repo.critical}</span>}
                    {repo.high > 0 && <span className="text-cyber-warning bg-cyber-warning/10 border border-cyber-warning/20 px-1.5 py-0.5 rounded">H: {repo.high}</span>}
                    {repo.critical === 0 && repo.high === 0 && <span className="text-cyber-success bg-cyber-success/10 border border-cyber-success/20 px-1.5 py-0.5 rounded">Secure</span>}
                  </div>
                </div>

                {/* Webhook trigger configuration */}
                <div className="pt-3 border-t border-cyber-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-505">
                    <span>AI Auto-Patch PRs</span>
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-500 cursor-help" title="If enabled, AI will write PR suggestions directly as GitHub reviews." />
                  </div>
                  <button 
                    onClick={() => handleToggleAutoPatch(repo)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    {repo.autoPatch ? (
                      <ToggleRight className="w-8 h-8 text-cyber-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-505 mt-4 h-24">
                Connect this repository to set up webhook automation triggers for commit push events and pull request code security checks.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-cyber-border">
            {repo.connected ? (
              <>
                <button 
                  onClick={() => handleScanNow(repo)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 border text-xs rounded-xl transition-all font-semibold ${
                    repo.scanning 
                      ? 'border-cyber-danger/35 hover:bg-cyber-danger/10 hover:text-cyber-danger text-cyber-danger shadow-[0_0_10px_rgba(239,68,68,0.1)] bg-white dark:bg-zinc-900' 
                      : 'border-cyber-primary/40 text-cyber-primary hover:text-white hover:bg-cyber-primary hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-white dark:bg-zinc-900'
                  }`}
                >
                  {repo.scanning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyber-danger" />
                      <span>Cancel Scan</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Scan Now</span>
                    </>
                  )}
                </button>

                {repo.scanCompleted && (
                  <Link
                    to="/scans/feed"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-cyber-success/40 hover:border-cyber-success hover:bg-cyber-success hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] text-xs text-cyber-success rounded-xl transition-all font-semibold animate-fade-in-up"
                  >
                    <span>Result</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}

                <button 
                  onClick={() => handleConnectToggle(repo)}
                  disabled={repo.scanning}
                  className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-cyber-danger/30 hover:bg-cyber-danger/10 text-cyber-danger text-xs rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Disconnect Repo
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleConnectToggle(repo)}
                className="w-full py-2.5 bg-cyber-primary hover:bg-cyber-primary/95 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                Connect Repository
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
