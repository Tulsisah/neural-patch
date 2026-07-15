import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, change, isPositive, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'text-cyber-primary bg-cyber-primary/10 border-cyber-primary/30',
    success: 'text-cyber-success bg-cyber-success/10 border-cyber-success/30',
    danger: 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/30',
    warning: 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30',
  };

  return (
    <div className="glass glass-hover p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
      {/* Background glow overlay */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyber-primary/10 to-transparent blur-2xl group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</span>
        {Icon && (
          <div className={`p-2.5 border rounded-xl ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{value}</span>
        </div>
        {change && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive 
              ? 'bg-cyber-success/10 text-cyber-success border border-cyber-success/20' 
              : 'bg-cyber-danger/10 text-cyber-danger border border-cyber-danger/20'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
