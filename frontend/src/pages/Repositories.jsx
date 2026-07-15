import React, { useState } from 'react';
import RepoList from '../components/repos/RepoList';
import ConnectRepoModal from '../components/repos/ConnectRepoModal';
import { Plus, Info } from 'lucide-react';

export default function Repositories() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnect = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Repositories</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage integrated codebases, trigger scans, and configure automated PR comments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/95 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {/* Webhook Alert Note */}
      <div className="p-4 bg-cyber-primaryGlow border border-cyber-primary/20 rounded-2xl flex gap-3 text-xs text-zinc-350">
        <Info className="w-5 h-5 text-cyber-primary shrink-0" />
        <p>
          <strong>Automatic scanning:</strong> We automatically listen to <code>push</code> and <code>pull_request</code> hooks from connected repositories. AI review comments will be posted directly to your pull requests when issues are identified.
        </p>
      </div>

      {/* Grid List */}
      <RepoList refreshKey={refreshKey} />

      {/* Modal Popup */}
      <ConnectRepoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={handleConnect} />
    </div>
  );
}
