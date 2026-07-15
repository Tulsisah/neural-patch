import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, GitBranch, ArrowRight, Shield } from 'lucide-react';

export default function RecentScans() {
  const scans = [
    { id: 'scan-102', repo: 'backend-auth-service', status: 'completed', branch: 'main', critical: 1, high: 2, date: '5 mins ago' },
    { id: 'scan-101', repo: 'payment-gateway-v3', status: 'failed', branch: 'release-v1.1', critical: 0, high: 0, date: '40 mins ago' },
    { id: 'scan-100', repo: 'react-soc-dashboard', status: 'completed', branch: 'feat/webhooks', critical: 0, high: 1, date: '3 hours ago' },
    { id: 'scan-099', repo: 'kubernetes-infra', status: 'completed', branch: 'staging', critical: 3, high: 4, date: '1 day ago' },
  ];

  return (
    <div className="glass p-6 rounded-2xl flex flex-col justify-between h-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Threat Intel stream</h3>
        <span className="text-[10px] text-zinc-500 font-mono">Total scans: 432</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {scans.map((scan) => {
          const hasVulnerabilities = scan.critical > 0 || scan.high > 0;
          return (
            <Link
              key={scan.id}
              to={`/scans/${scan.id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-cyber-border hover:border-cyber-primary/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 transition-all duration-200 group block"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  scan.status === 'failed' 
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500' 
                    : hasVulnerabilities 
                      ? 'bg-cyber-danger/10 text-cyber-danger' 
                      : 'bg-cyber-success/10 text-cyber-success'
                }`}>
                  {scan.status === 'failed' ? (
                    <Shield className="w-4 h-4" />
                  ) : hasVulnerabilities ? (
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{scan.repo}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-0.5"><GitBranch className="w-2.5 h-2.5" />{scan.branch}</span>
                    <span>•</span>
                    <span>{scan.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {scan.status === 'failed' ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Failed</span>
                ) : (
                  <div className="flex gap-1.5">
                    {scan.critical > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30">
                        C: {scan.critical}
                      </span>
                    )}
                    {scan.high > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyber-warning/20 text-cyber-warning border border-cyber-warning/30">
                        H: {scan.high}
                      </span>
                    )}
                    {scan.critical === 0 && scan.high === 0 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyber-success/20 text-cyber-success border border-cyber-success/30">
                        Clean
                      </span>
                    )}
                  </div>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyber-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
