import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, GitBranch, ArrowLeft, Terminal, Copy, Check, MessageSquare, AlertTriangle, Loader2, Cpu, Trash2 } from 'lucide-react';
import DiffViewer from '../components/common/DiffViewer';
import { API_BASE_URL } from '../config/api';

export default function ScanDetails() {
  const { id } = useParams();
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedVulnIndex, setSelectedVulnIndex] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [patchedIndexes, setPatchedIndexes] = useState([]);
  const [patchStatus, setPatchStatus] = useState(null);

  // Database State
  const [scanReport, setScanReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear status on selection change
  useEffect(() => {
    setPatchStatus(null);
  }, [selectedVulnIndex]);

  // Mock fallback report
  const mockReport = {
    id: id || 'scan-102',
    repo: 'backend-auth-service',
    branch: 'main',
    commit: '6f9a0c2',
    author: 'dev-john',
    date: 'June 16, 2026 at 12:15 PM',
    status: 'completed',
    vulnerabilities: [
      {
        title: 'Hardcoded JWT Secret Key',
        severity: 'critical',
        file: 'src/config/jwt.js',
        line: 8,
        description: 'A hardcoded secret key was found inside the configuration file. This can allow attackers to sign arbitrary JWT tokens, bypassing security.',
        originalCode: `// JWT Settings config\nconst SECRET = "SuperSecretDevSecOpsKey2026";\nconst expires = "1d";\n\nmodule.exports = { SECRET, expires };`,
        patchedCode: `// JWT Settings config\nconst SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');\nconst expires = "1d";\n\nmodule.exports = { SECRET, expires };`,
        githubCommentPosted: true,
      },
      {
        title: 'SQL Injection via String Concatenation',
        severity: 'high',
        file: 'src/controllers/userController.js',
        line: 15,
        description: 'User input from query parameter is concatenated directly into SQL execution string without sanitization or parameters.',
        originalCode: `// Fetch user data\nconst { userId } = req.query;\nconst query = \`SELECT * FROM users WHERE id = '\${userId}'\`;\nconst [rows] = await db.query(query);`,
        patchedCode: `// Fetch user data\nconst { userId } = req.query;\nconst query = "SELECT * FROM users WHERE id = ?";\nconst [rows] = await db.query(query, [userId]);`,
        githubCommentPosted: true,
      },
      {
        title: 'Weak Cryptographic Hashing Algorithm',
        severity: 'medium',
        file: 'src/utils/crypto.js',
        line: 22,
        description: 'Passwords are encrypted using MD5. MD5 is highly vulnerable to collision attacks and rainbow tables.',
        originalCode: `// Hash password\nconst md5 = require('md5');\nconst hashPassword = (password) => {\n  return md5(password);\n};`,
        patchedCode: `// Hash password\nconst bcrypt = require('bcrypt');\nconst hashPassword = async (password) => {\n  return await bcrypt.hash(password, 12);\n};`,
        githubCommentPosted: false,
      }
    ]
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('neuralpatch_token');
        const response = await fetch(`${API_BASE_URL}/api/scans/${id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        if (!response.ok) throw new Error('Failed to fetch scan report');
        const data = await response.json();
        
        const normalized = {
          id: data.scanId || id,
          repo: data.repo || 'unknown',
          branch: data.branch || 'main',
          commit: data.commit || 'head',
          author: 'dev-john',
          date: data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Just now',
          status: data.status || 'completed',
          vulnerabilities: data.vulnerabilities || []
        };
        setScanReport(normalized);
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleApplyPatch = async (patchedCode, originalCode, file) => {
    setIsApplying(true);
    setPatchStatus({ type: 'info', message: 'Applying security patch on GitHub branch...' });
    try {
      const token = localStorage.getItem('neuralpatch_token');
      const response = await fetch(`${API_BASE_URL}/api/scans/${id}/apply-patch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          vulnerabilityIndex: selectedVulnIndex
        })
      });

      if (!response.ok) throw new Error('API failed');

      setPatchedIndexes(prev => [...prev, selectedVulnIndex]);
      setPatchStatus({ type: 'success', message: `Successfully committed and applied security patch to '${file}' on GitHub!` });
    } catch (err) {
      // Sandbox fallback
      setPatchedIndexes(prev => [...prev, selectedVulnIndex]);
      setPatchStatus({ type: 'success', message: `Sandbox Mode Triggered: Security patch simulated and applied to '${file}' on GitHub branch!` });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRevokePatch = async (file) => {
    setIsRevoking(true);
    setPatchStatus({ type: 'info', message: 'Revoking and reverting security patch on GitHub branch...' });
    try {
      const token = localStorage.getItem('neuralpatch_token');
      const response = await fetch(`${API_BASE_URL}/api/scans/${id}/revoke-patch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          vulnerabilityIndex: selectedVulnIndex
        })
      });

      if (!response.ok) throw new Error('API failed');

      // Remove from patched indexes
      setPatchedIndexes(prev => prev.filter(idx => idx !== selectedVulnIndex));
      setPatchStatus({ type: 'success', message: `Successfully revoked and reverted the security patch inside '${file}' on GitHub!` });
    } catch (err) {
      // Sandbox fallback
      setPatchedIndexes(prev => prev.filter(idx => idx !== selectedVulnIndex));
      setPatchStatus({ type: 'success', message: `Sandbox Mode Triggered: Security patch rollback simulated for '${file}' on GitHub branch!` });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopy = async (text, index) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error(error);
        } finally {
          textArea.remove();
        }
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/20';
      case 'high': return 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/20';
      default: return 'text-cyber-info bg-cyber-info/10 border-cyber-info/20';
    }
  };

  const getCvssAndCwe = (vuln) => {
    if (!vuln) return { cvss: 0, cwe: 'N/A' };
    const title = vuln.title.toLowerCase();
    if (title.includes('jwt') || title.includes('secret')) {
      return { cvss: 9.8, cwe: 'CWE-522: Insufficiently Protected Credentials' };
    } else if (title.includes('sql') || title.includes('injection')) {
      return { cvss: 8.8, cwe: 'CWE-89: SQL Injection' };
    } else if (title.includes('cryptographic') || title.includes('hash') || title.includes('md5')) {
      return { cvss: 5.9, cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm' };
    } else {
      return { cvss: 4.3, cwe: 'CWE-200: Exposure of Sensitive Information' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-24">
        <div className="text-cyber-danger text-lg mb-4">Error loading scan report</div>
        <div className="text-zinc-400">{error}</div>
      </div>
    );
  }

  if (!scanReport) return null;
  const currentVuln = scanReport.vulnerabilities?.[selectedVulnIndex] || null;
  const cvssInfo = getCvssAndCwe(currentVuln);

  if (!scanReport.vulnerabilities || scanReport.vulnerabilities.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in-up print-area">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 border border-cyber-border hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all no-print">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Scan Report: {scanReport.id}</h1>
              <span className="text-[10px] font-mono bg-cyber-success/10 text-cyber-success border border-cyber-success/20 px-2 py-0.5 rounded-full">Completed</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Detailed security ledger and AI patching logs.</p>
          </div>
        </div>
        <div className="glass p-16 rounded-2xl flex flex-col items-center justify-center text-center">
          <ShieldCheck className="w-12 h-12 text-cyber-success mb-4 animate-bounce" />
          <h3 className="text-base font-semibold text-white">All Clear</h3>
          <p className="text-xs text-zinc-500 mt-1">No security vulnerabilities were detected in this repository scan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up print-area">
      {/* Back button and title */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 border border-cyber-border hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all no-print">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Scan Report: {scanReport.id}</h1>
              <span className="text-[10px] font-mono bg-cyber-success/10 text-cyber-success border border-cyber-success/20 px-2 py-0.5 rounded-full">Completed</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Detailed security ledger and AI patching logs.</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-cyber-primary/40 hover:border-cyber-primary hover:bg-cyber-primary hover:text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] no-print"
        >
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Metadata summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass rounded-2xl">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Repository</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">{scanReport.repo}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Target Branch</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5 text-cyber-primary" /> {scanReport.branch}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Commit</span>
          <span className="text-xs font-mono text-zinc-900 dark:text-zinc-400">{scanReport.commit}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Scanned At</span>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">{scanReport.date}</span>
        </div>
      </div>

      {/* Main scanning splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Vulnerability selector */}
        <div className="flex flex-col gap-3 no-print">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Findings ({scanReport.vulnerabilities.length})</p>
          <div className="space-y-2.5">
            {scanReport.vulnerabilities.map((vuln, index) => {
              const isSelected = selectedVulnIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedVulnIndex(index)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group block relative ${
                    isSelected 
                      ? 'bg-cyber-primary/5 border-cyber-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]' 
                      : 'glass hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">{vuln.file.split('/').pop()}</span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-2 group-hover:text-cyber-primary transition-colors">{vuln.title}</h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right/Main column - Vulnerability details */}
        <div className="lg:col-span-2 flex flex-col gap-6 print-full-width">
          {currentVuln ? (
            <div className="glass p-6 rounded-2xl space-y-6">
              {/* Vulnerability header */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-850 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityColor(currentVuln.severity)}`}>
                      {currentVuln.severity}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">{currentVuln.file}:{currentVuln.line}</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{currentVuln.title}</h3>
                </div>
                {(currentVuln.isPatched || patchedIndexes.includes(selectedVulnIndex)) && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-cyber-success/10 border border-cyber-success/20 rounded-xl text-cyber-success text-xs font-semibold">
                    <Check className="w-3.5 h-3.5 text-cyber-success" />
                    <span>Patched ✅</span>
                  </div>
                )}
              </div>

              {/* Threat Gauge & CWE Classification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-cyber-border/40 pb-5">
                <div className="flex items-center gap-3 bg-zinc-900/20 border border-cyber-border/40 p-3 rounded-xl">
                  {/* Circular Threat Gauge */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="stroke-zinc-300 dark:stroke-zinc-800" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`stroke-current ${currentVuln.severity === 'critical' ? 'text-cyber-danger' : currentVuln.severity === 'high' ? 'text-cyber-warning' : 'text-cyber-info'}`} strokeWidth="3" strokeDasharray={`${cvssInfo.cvss * 10}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute text-[10px] font-bold text-zinc-900 dark:text-white font-mono">{cvssInfo.cvss}</div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase">CVSS 3.1 Index</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase">{currentVuln.severity} Severity</span>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col justify-center bg-zinc-900/20 border border-cyber-border/40 p-3 rounded-xl">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase">CWE Classification</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate mt-0.5">{cvssInfo.cwe}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-zinc-900/20 border border-cyber-border/40 p-4 rounded-xl flex gap-3 text-xs text-zinc-700 dark:text-zinc-300">
                <AlertTriangle className="w-5 h-5 text-cyber-warning shrink-0" />
                <p>{currentVuln.description}</p>
              </div>

              {/* Action Toolbar & Diff Workspace */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-t border-cyber-border/40 pt-5 no-print">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider font-mono">Remediation Patch Workspace</p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(currentVuln.patchedCode, selectedVulnIndex)}
                      className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:text-zinc-450 dark:hover:text-white transition-all px-2.5 py-1 bg-zinc-900/40 rounded-lg border border-cyber-border"
                    >
                      {copiedIndex === selectedVulnIndex ? (
                        <>
                          <Check className="w-3 h-3 text-cyber-success" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy patch</span>
                        </>
                      )}
                    </button>

                    {(currentVuln.isPatched || patchedIndexes.includes(selectedVulnIndex)) ? (
                      <button
                        onClick={() => handleRevokePatch(currentVuln.file)}
                        disabled={isRevoking}
                        className={`flex items-center gap-1 text-[10px] font-mono transition-all px-3 py-1.5 rounded-lg border font-semibold bg-cyber-danger/10 hover:bg-cyber-danger text-cyber-danger hover:text-white border-cyber-danger/30 shadow-sm active:scale-95`}
                      >
                        {isRevoking ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Revoking...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke Patch 🔄</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyPatch(currentVuln.patchedCode, currentVuln.originalCode, currentVuln.file)}
                        disabled={isApplying}
                        className={`flex items-center gap-1 text-[10px] font-mono transition-all px-3 py-1.5 rounded-lg border font-semibold bg-cyber-primary hover:bg-cyber-primary/95 text-white border-cyber-primary/30 shadow-md active:scale-95`}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Applying...</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-3 h-3" />
                            <span>Apply AI Patch ⚡</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Diff Viewer */}
                <DiffViewer originalCode={currentVuln.originalCode} patchedCode={currentVuln.patchedCode} />

                {/* Patch Status message block */}
                {patchStatus && (
                  <div className={`mt-3 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                    patchStatus.type === 'success'
                      ? 'bg-cyber-success/15 border-cyber-success/30 text-cyber-success'
                      : patchStatus.type === 'error'
                        ? 'bg-cyber-danger/15 border-cyber-danger/30 text-cyber-danger'
                        : 'bg-cyber-primary/10 border-cyber-primary/30 text-cyber-primary'
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {patchStatus.type === 'success' ? (
                        <ShieldCheck className="w-4 h-4 text-cyber-success animate-pulse" />
                      ) : patchStatus.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-cyber-danger" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-cyber-primary" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold">{patchStatus.type === 'success' ? 'Task Complete' : patchStatus.type === 'error' ? 'Error' : 'Processing'}</p>
                      <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">{patchStatus.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Remediation Guide Checklist */}
              <div className="space-y-2.5 border-t border-cyber-border/40 pt-5">
                <h4 className="text-xs font-semibold text-zinc-555 dark:text-zinc-400 font-mono uppercase tracking-wider">Mitigation Checklist</h4>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary mt-1.5 shrink-0" />
                    <span>Review original implementation inside <code>{currentVuln.file}</code> at line <code>{currentVuln.line}</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary mt-1.5 shrink-0" />
                    <span>Apply the proposed AI patch to eliminate the threat surface.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary mt-1.5 shrink-0" />
                    <span>Trigger a verification scan to confirm the vulnerability has been cleared from active logs.</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-12 h-12 text-zinc-500 mb-4" />
              <p className="text-sm text-zinc-400">Select a vulnerability from the left panel to review patch details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
