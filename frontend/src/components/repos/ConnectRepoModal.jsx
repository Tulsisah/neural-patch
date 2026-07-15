import React, { useState, useEffect } from 'react';
import { Github, Search, Plus, Check, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function ConnectRepoModal({ isOpen, onClose, onConnect }) {
  const [search, setSearch] = useState('');
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Mock fallback list
  const mockGithubRepos = [
    { id: 'gh-1', name: 'docker-security-hardening', owner: 'org-admin', url: 'https://github.com/org-admin/docker-security-hardening', stars: 12, language: 'Dockerfile' },
    { id: 'gh-2', name: 'payment-processor', owner: 'org-admin', url: 'https://github.com/org-admin/payment-processor', stars: 4, language: 'Go' },
    { id: 'gh-3', name: 'user-jwt-auth-service', owner: 'org-admin', url: 'https://github.com/org-admin/user-jwt-auth-service', stars: 92, language: 'TypeScript' },
    { id: 'gh-4', name: 'nginx-reverse-proxy', owner: 'org-admin', url: 'https://github.com/org-admin/nginx-reverse-proxy', stars: 3, language: 'Nginx' },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const fetchRepos = async () => {
      const token = sessionStorage.getItem('neuralpatch_token');
      if (!token) {
        setGithubRepos(mockGithubRepos);
        return;
      }

      setLoadingRepos(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/github/repos`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('GitHub API failed via proxy');
        const data = await response.json();
        
        const mapped = data.map(item => ({
          id: String(item.id),
          name: item.name,
          owner: item.owner.login,
          url: item.html_url,
          stars: item.stargazers_count,
          language: item.language || 'JavaScript'
        }));
        setGithubRepos(mapped);
      } catch (err) {
        console.warn("Could not fetch real GitHub repos, using mock data:", err);
        setGithubRepos(mockGithubRepos);
      } finally {
        setLoadingRepos(false);
      }
    };

    fetchRepos();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = githubRepos.filter(repo => 
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleImport = async (repo) => {
    setImportingId(repo.id);
    try {
      const token = sessionStorage.getItem('neuralpatch_token');
      const response = await fetch(`${API_BASE_URL}/api/repos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          name: repo.name,
          owner: repo.owner || 'org-admin',
          url: repo.url || `https://github.com/${repo.owner}/${repo.name}`
        })
      });

      if (!response.ok) throw new Error('API failed');

      setImportedIds(prev => [...prev, repo.id]);
      if (onConnect) onConnect(); // Trigger dashboard/repos refresh
      alert(`Successfully connected ${repo.name} and registered webhook triggers!`);
    } catch (err) {
      // Sandbox fallback
      console.warn("API connect failed, simulating sandbox connection:", err);
      setImportedIds(prev => [...prev, repo.id]);
      if (onConnect) onConnect();
      alert(`Connected ${repo.name} in simulated Sandbox mode!`);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in-up">
      <div className="bg-cyber-card border border-cyber-border rounded-3xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-800/80 rounded-lg text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Connect GitHub Repository</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Select a repository to install DevSecOps webhooks.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/50">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your GitHub repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-cyber-bg border border-zinc-805 focus:border-cyber-primary rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Repository list container */}
        <div className="p-6 max-h-60 overflow-y-auto space-y-3">
          {loadingRepos ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyber-primary" />
              <span className="text-xs text-zinc-550 dark:text-zinc-500 font-mono">Syncing GitHub repositories...</span>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((repo) => {
              const isImported = importedIds.includes(repo.id);
              const isCurrentlyImporting = importingId === repo.id;

              return (
                <div key={repo.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700/80 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200">{repo.name}</span>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-505 font-mono">
                      <span>⭐ {repo.stars}</span>
                      <span>•</span>
                      <span>{repo.language}</span>
                    </div>
                  </div>

                  <button
                    disabled={isImported || isCurrentlyImporting}
                    onClick={() => handleImport(repo)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isImported 
                        ? 'bg-cyber-success/10 text-cyber-success border border-cyber-success/20 cursor-default' 
                        : isCurrentlyImporting
                          ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                          : 'bg-cyber-primary hover:bg-cyber-primary/95 text-white shadow-sm'
                    }`}
                  >
                    {isCurrentlyImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : isImported ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-xs text-zinc-500 py-6">No repositories found matching "{search}"</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900/20 border-t border-zinc-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-zinc-505 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
