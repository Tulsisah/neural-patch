import React, { useMemo } from 'react';

// Longest Common Subsequence line-by-line diff algorithm
function diffLines(oldStr, newStr) {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const oldLen = oldLines.length;
  const newLen = newLines.length;

  if (oldLen * newLen > 250000) {
    return [
      { type: 'removed', text: '// [OOM Prevention] File is too large for inline diff', oldLine: 1 },
      { type: 'added', text: '// [OOM Prevention] File is too large for inline diff', newLine: 1 }
    ];
  }

  const dp = Array(oldLen + 1)
    .fill(null)
    .map(() => Array(newLen + 1).fill(0));

  for (let i = 1; i <= oldLen; i++) {
    for (let j = 1; j <= newLen; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff = [];
  let i = oldLen;
  let j = newLen;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.push({
        type: 'unchanged',
        text: oldLines[i - 1],
        oldLine: i,
        newLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({
        type: 'added',
        text: newLines[j - 1],
        newLine: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      diff.push({
        type: 'removed',
        text: oldLines[i - 1],
        oldLine: i,
      });
      i--;
    }
  }

  return diff.reverse();
}

export default function DiffViewer({ originalCode = '', patchedCode = '' }) {
  const diffs = useMemo(() => diffLines(originalCode, patchedCode), [originalCode, patchedCode]);

  return (
    <div className="font-mono text-xs border border-cyber-border/80 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-inner">
      <div className="bg-zinc-900/60 px-4 py-2 border-b border-cyber-border/60 flex items-center justify-between text-zinc-400">
        <span>Interactive Security Code Diff</span>
        <div className="flex gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-emerald-400">Patched</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" />
            <span className="text-red-400">Original</span>
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse select-text">
          <tbody>
            {diffs.map((line, idx) => {
              let rowClass = 'hover:bg-zinc-900/30';
              let numClass = 'text-zinc-650 dark:text-zinc-500 border-r border-zinc-900';
              let sign = ' ';

              if (line.type === 'added') {
                rowClass = 'bg-emerald-950/20 text-emerald-300 dark:text-emerald-250';
                numClass = 'bg-emerald-950/30 text-emerald-500/80 border-r border-emerald-900/20';
                sign = '+';
              } else if (line.type === 'removed') {
                rowClass = 'bg-red-950/20 text-red-300 dark:text-red-250 line-through';
                numClass = 'bg-red-950/30 text-red-500/80 border-r border-red-900/20';
                sign = '-';
              }

              return (
                <tr key={idx} className={`${rowClass} transition-colors leading-relaxed`}>
                  {/* Left Line Number (Original) */}
                  <td className={`w-10 text-right pr-2 py-0.5 select-none font-semibold ${numClass}`}>
                    {line.oldLine || ''}
                  </td>
                  {/* Right Line Number (Patched) */}
                  <td className={`w-10 text-right pr-2 py-0.5 select-none font-semibold ${numClass}`}>
                    {line.newLine || ''}
                  </td>
                  {/* Sign Indicator */}
                  <td className="w-6 text-center select-none font-semibold text-zinc-500">
                    {sign}
                  </td>
                  {/* Code Line Content */}
                  <td className="pl-3 pr-4 py-0.5 whitespace-pre">
                    {line.text}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
