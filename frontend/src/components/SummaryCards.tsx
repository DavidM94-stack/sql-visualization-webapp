import React from 'react';
import { Clock, DollarSign, AlertOctagon, HardDrive, ShieldCheck } from 'lucide-react';
import { AnalysisSummary } from '../types/plan';

interface SummaryCardsProps {
  summary: AnalysisSummary | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-4 gap-3 p-4 bg-[#090d16] border-b border-[#1e293b]">
      {/* 1. Execution Time */}
      <div className="bg-[#0f172a] p-3 rounded-lg border border-[#1e293b] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Execution Time</span>
          <span className="text-lg font-bold font-mono text-cyan-400">
            {summary.total_actual_time_ms.toFixed(2)} <span className="text-xs font-normal text-slate-400">ms</span>
          </span>
        </div>
        <div className="p-2 bg-cyan-950/60 rounded-md border border-cyan-800/50">
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      {/* 2. Total Cost */}
      <div className="bg-[#0f172a] p-3 rounded-lg border border-[#1e293b] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Root Node Cost</span>
          <span className="text-lg font-bold font-mono text-purple-400">
            {summary.total_cost.toLocaleString()}
          </span>
        </div>
        <div className="p-2 bg-purple-950/60 rounded-md border border-purple-800/50">
          <DollarSign className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      {/* 3. Critical Bottlenecks */}
      <div className={`p-3 rounded-lg border flex items-center justify-between ${
        summary.critical_bottlenecks > 0 
          ? 'bg-rose-950/30 border-rose-900/60' 
          : 'bg-[#0f172a] border-[#1e293b]'
      }`}>
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Critical Bottlenecks</span>
          <span className={`text-lg font-bold font-mono ${
            summary.critical_bottlenecks > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {summary.critical_bottlenecks} {summary.critical_bottlenecks > 0 ? 'Found' : 'Clean'}
          </span>
        </div>
        <div className={`p-2 rounded-md border ${
          summary.critical_bottlenecks > 0 
            ? 'bg-rose-900/40 border-rose-700/50' 
            : 'bg-emerald-950/60 border-emerald-800/50'
        }`}>
          {summary.critical_bottlenecks > 0 ? (
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
        </div>
      </div>

      {/* 4. Cache Hit Ratio */}
      <div className="bg-[#0f172a] p-3 rounded-lg border border-[#1e293b] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">RAM Cache Hit Ratio</span>
          <span className={`text-lg font-bold font-mono ${
            summary.cache_hit_ratio < 80 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {summary.cache_hit_ratio.toFixed(1)}%
          </span>
        </div>
        <div className="p-2 bg-slate-800/60 rounded-md border border-slate-700">
          <HardDrive className="w-4 h-4 text-amber-400" />
        </div>
      </div>
    </div>
  );
};
