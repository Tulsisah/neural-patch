import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Settings, ShieldAlert, Cpu, MessageSquare } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Repositories', path: '/repositories', icon: GitBranch },
    { name: 'Vulnerability Feed', path: '/scans/feed', icon: ShieldAlert },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-64 border-r border-cyber-border bg-cyber-bg p-3 md:p-4 flex flex-col justify-between h-[calc(100vh-4rem)] transition-all duration-300">
      <div className="flex flex-col gap-2">
        <p className="text-[9px] text-zinc-550 dark:text-zinc-500 font-mono tracking-wider uppercase px-2 md:px-4 mb-2 text-center md:text-left">
          <span className="hidden md:inline">Navigation</span>
          <span className="inline md:hidden">Nav</span>
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              title={link.name}
              className={`flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-lg text-sm transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-white dark:bg-cyber-primary/10 text-zinc-900 dark:text-white font-semibold border border-cyber-primary/20 dark:border-cyber-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-cyber-primary rounded-r-md" />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-cyber-primary' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`} />
              <span className="hidden md:inline">{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer - Hidden on Mobile */}
      <div className="hidden md:flex p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-cyber-border/80 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <Cpu className="w-3.5 h-3.5 text-cyber-primary animate-pulse" />
          <span>Scanner Node #01</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
          <div className="bg-cyber-primary h-1.5 rounded-full w-[45%]" />
        </div>
        <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-0.5">
          <span>Memory: 45%</span>
          <span>Load: Stable</span>
        </div>
      </div>
    </aside>
  );
}
