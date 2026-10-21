import React from 'react';
import { Terminal, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AgentLog } from '../types';

interface AgentConsoleProps {
  logs: AgentLog[];
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  onClearLogs: () => void;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  logs,
  isExpanded,
  setIsExpanded,
  onClearLogs
}) => {
  if (logs.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
            Multi-Agent Execution Pipeline Monitor
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearLogs();
            }}
            className="text-[11px] text-slate-500 hover:text-slate-300 px-2 py-0.5"
          >
            Clear
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs bg-slate-950/90 divide-y divide-slate-900">
          {logs.map((log) => {
            let statusIcon = <Clock className="w-3.5 h-3.5 text-slate-500" />;
            let badgeClass = 'bg-slate-800 text-slate-400 border-slate-700';

            if (log.status === 'success') {
              statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
              badgeClass = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
            } else if (log.status === 'in_progress') {
              statusIcon = <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />;
              badgeClass = 'bg-indigo-950/80 text-indigo-400 border-indigo-800';
            } else if (log.status === 'warning') {
              statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
              badgeClass = 'bg-amber-950/80 text-amber-400 border-amber-800';
            } else if (log.status === 'error') {
              statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
              badgeClass = 'bg-rose-950/80 text-rose-400 border-rose-800';
            }

            return (
              <div key={log.id} className="pt-1.5 flex items-start gap-2.5 text-[11px]">
                <span className="text-slate-600 shrink-0 select-none">
                  {log.timestamp}
                </span>
                <span className="shrink-0">{statusIcon}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeClass}`}>
                  {log.agent}
                </span>
                <span className="text-slate-300 leading-snug flex-1">
                  {log.message}
                </span>
                {log.dataCount !== undefined && (
                  <span className="text-cyan-400 font-bold shrink-0">
                    +{log.dataCount} records
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
