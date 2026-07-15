import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/dashboard/StatCard';
import RecentScans from '../components/dashboard/RecentScans';
import VulnerabilityChart from '../components/dashboard/VulnerabilityChart';
import ChatWidget from '../components/dashboard/ChatWidget';
import { GitBranch, ShieldAlert, Award, Play, Activity, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { token } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRepos: 0,
    criticalVulns: 0,
    aiPatchRate: 100,
    cleanRepos: 0,
    warnRepos: 0,
    atRiskRepos: 0,
    grade: 'A+'
  });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/scans/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      }
    };
    if (token) fetchMetrics();
  }, [token, API_URL]);

  const handleGlobalScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const model = sessionStorage.getItem('neuralpatch_ai_model') || 'gemini-1.5-flash';
      const res = await fetch(`${API_URL}/api/scans/global`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ model })
      });
      if (res.ok) {
        alert("Global threat audit scan queued successfully across all active repositories!");
      } else {
        alert("Failed to trigger global scan.");
      }
    } catch (error) {
      console.error("Error triggering scan:", error);
      alert("Network error triggering global scan.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header section with live feed ticker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Security Operations Center</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Real-time repository threat detection & automated AI patching metrics.</p>
        </div>
        
        {/* Quick action controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGlobalScan}
            disabled={isScanning}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
              isScanning
                ? 'bg-zinc-500 cursor-not-allowed text-white'
                : 'bg-cyber-primary hover:bg-cyber-primary/95 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Queuing Scans...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Trigger Global Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/repositories" className="block group">
          <StatCard 
            title="Total Repositories" 
            value={metrics.totalRepos.toString()} 
            change="Live" 
            isPositive={true}
            icon={GitBranch}
            color="primary"
          />
        </Link>
        <Link to="/scans/feed?severity=critical" className="block group">
          <StatCard 
            title="Critical Vulnerabilities" 
            value={metrics.criticalVulns.toString()} 
            change={metrics.criticalVulns > 0 ? "Needs Review" : "Clear"} 
            isPositive={metrics.criticalVulns === 0}
            icon={ShieldAlert}
            color="danger"
          />
        </Link>
        <Link to="/chat" className="block group">
          <StatCard 
            title="AI Patch Rate" 
            value={`${metrics.aiPatchRate}%`} 
            change="Automated" 
            isPositive={parseFloat(metrics.aiPatchRate) > 80}
            icon={Award}
            color="success"
          />
        </Link>
        <Link to="/settings" className="block group">
          <StatCard 
            title="Queue Load" 
            value="Stable" 
            change="Connected" 
            isPositive={true}
            icon={Activity}
            color="warning"
          />
        </Link>
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG interactive chart area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <VulnerabilityChart />
          
          {/* Custom Security Health summary widget */}
          <div className="glass p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col max-w-md">
              <h4 className="text-sm font-semibold text-zinc-200">Neural Security Grade: {metrics.grade}</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Your codebases are currently tracking {metrics.criticalVulns} critical vulnerabilities requiring immediate review. AI agents are actively patching {metrics.aiPatchRate}% of discovered issues.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-zinc-800"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-cyber-success"
                    strokeWidth="3.5"
                    strokeDasharray={`${metrics.aiPatchRate}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute font-bold text-sm text-white font-mono">{metrics.aiPatchRate}%</div>
              </div>
              <div className="flex flex-col text-xs text-zinc-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-success" /> {metrics.cleanRepos} Clean</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-warning" /> {metrics.warnRepos} Warn</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyber-danger" /> {metrics.atRiskRepos} Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scan Log feed */}
        <div className="h-full">
          <RecentScans />
        </div>
      </div>

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  );
}
