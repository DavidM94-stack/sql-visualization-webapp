import React, { useState } from 'react';
import { X, AlertCircle, Copy, Check, Terminal, Cpu, Database, HardDrive, Filter, Activity, Zap } from 'lucide-react';
import { PlanNodeData } from '../types/plan';

interface NodeDetailDrawerProps {
  nodeData: PlanNodeData | null;
  onClose: () => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({ nodeData, onClose }) => {
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  if (!nodeData) return null;

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(sql);
    setTimeout(() => setCopiedSql(null), 2000);
  };

  const rowRatio = nodeData.planRows > 0 
    ? (nodeData.actualRows / nodeData.planRows).toFixed(1) 
    : '1.0';

  return (
    <div className="absolute top-0 right-0 h-full w-[460px] bg-[#0f172a] border-l border-[#334155] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 bg-[#090d16] border-b border-[#334155] flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Database className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-slate-100 truncate">{nodeData.nodeType}</h2>
            <p className="text-xs text-slate-400">
              {nodeData.relationName ? `Relation: ${nodeData.relationName}` : 'Execution Step Metrics'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Severity Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          nodeData.severity === 'critical'
            ? 'bg-rose-950/40 border-rose-800 text-rose-300'
            : nodeData.severity === 'medium'
            ? 'bg-amber-950/40 border-amber-800 text-amber-300'
            : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block">Node Cost Impact</span>
            <span className="text-lg font-extrabold font-mono">{nodeData.costPercentage}% of Root Query Cost</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-black/40 border border-current uppercase">
            {nodeData.severity}
          </span>
        </div>

        {/* Actionable Recommendations & SQL Remediation */}
        {nodeData.violations && nodeData.violations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Optimization Recommendations ({nodeData.violations.length})
            </h3>
            {nodeData.violations.map((violation, idx) => (
              <div key={idx} className="bg-[#1e293b] p-4 rounded-xl border border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-300">{violation.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-semibold">
                    {violation.rule_id}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{violation.description}</p>
                <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-700/80 text-xs text-cyan-300">
                  <span className="font-semibold text-slate-200 block mb-0.5">Recommendation:</span>
                  {violation.recommendation}
                </div>

                {/* SQL Remediation Script Box */}
                {violation.sql_remediation && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        SQL Remediation Script
                      </span>
                      <button
                        onClick={() => handleCopySql(violation.sql_remediation!)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer font-mono"
                      >
                        {copiedSql === violation.sql_remediation ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-[#090d16] p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto selection:bg-slate-700">
                      {violation.sql_remediation}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Execution Metrics Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            Execution Metrics Breakdown
          </h3>

          <div className="grid grid-cols-2 gap-3 font-mono">
            {/* Total Cost */}
            <div className="bg-[#1e293b] p-3 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 uppercase block">Total Cost</span>
              <span className="text-sm font-bold text-slate-100">{nodeData.totalCost.toLocaleString()}</span>
            </div>

            {/* Actual Total Time */}
            <div className="bg-[#1e293b] p-3 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 uppercase block">Actual Time</span>
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {nodeData.actualTotalTime.toFixed(2)} ms
              </span>
            </div>

            {/* Actual Rows */}
            <div className="bg-[#1e293b] p-3 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 uppercase block">Actual Rows</span>
              <span className="text-sm font-bold text-slate-100">{nodeData.actualRows.toLocaleString()}</span>
            </div>

            {/* Plan Rows & Variance */}
            <div className="bg-[#1e293b] p-3 rounded-xl border border-[#334155]">
              <span className="text-[10px] text-slate-400 uppercase block">Planner Rows</span>
              <span className="text-sm font-bold text-slate-100">
                {nodeData.planRows.toLocaleString()}{' '}
                <span className="text-[11px] font-normal text-slate-400">({rowRatio}x)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Shared Buffer I/O Stats */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-purple-400" />
            Buffer Cache & Disk I/O Blocks
          </h3>
          <div className="grid grid-cols-2 gap-3 font-mono bg-[#1e293b] p-3.5 rounded-xl border border-[#334155]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">RAM Hit Blocks</span>
              <span className="text-sm font-bold text-emerald-400">{nodeData.sharedHitBlocks.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Disk Read Blocks</span>
              <span className={`text-sm font-bold ${nodeData.sharedReadBlocks > 100 ? 'text-rose-400' : 'text-slate-200'}`}>
                {nodeData.sharedReadBlocks.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Expression Detail */}
        {nodeData.filterCond && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-cyan-400" />
              Filter Predicate
            </h3>
            <div className="bg-[#1e293b] p-3.5 rounded-xl border border-[#334155] space-y-2">
              <code className="text-xs font-mono text-cyan-300 block bg-[#090d16] p-2.5 rounded border border-slate-800 break-words">
                {nodeData.filterCond}
              </code>
              {nodeData.rowsRemovedByFilter > 0 && (
                <div className="text-[11px] text-amber-300 font-mono">
                  ⚠️ Discarded <span className="font-bold text-amber-400">{nodeData.rowsRemovedByFilter.toLocaleString()}</span> non-matching rows.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
