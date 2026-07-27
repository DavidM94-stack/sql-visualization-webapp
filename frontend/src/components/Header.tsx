import React from 'react';
import { Database, Play, RotateCcw, AlertTriangle, CheckCircle2, Cpu } from 'lucide-react';

interface HeaderProps {
  onAnalyze: () => void;
  onReset: () => void;
  onSelectSample: (sampleId: string) => void;
  sampleList: Array<{ id: string; title: string }>;
  selectedSampleId: string;
  isAnalyzing: boolean;
  serverOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAnalyze,
  onReset,
  onSelectSample,
  sampleList,
  selectedSampleId,
  isAnalyzing,
  serverOnline
}) => {
  return (
    <header className="h-16 bg-[#0f172a] border-b border-[#334155] px-6 flex items-center justify-between shrink-0 shadow-md">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            SQL Query Visualizer
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase tracking-wider">
              PostgreSQL Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400">EXPLAIN JSON Graph & Performance Heuristic Engine</p>
        </div>
      </div>

      {/* Middle Controls & Sample Preset Picker */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-[#334155]">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">Sample Plan:</span>
          <select
            value={selectedSampleId}
            onChange={(e) => onSelectSample(e.target.value)}
            className="bg-transparent text-xs font-medium text-cyan-300 focus:outline-none cursor-pointer pr-2"
          >
            {sampleList.map((sample) => (
              <option key={sample.id} value={sample.id} className="bg-[#0f172a] text-slate-200">
                {sample.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          {isAnalyzing ? 'Analyzing Plan...' : 'Analyze Plan'}
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-xs px-3 py-2 rounded-lg border border-[#334155] transition-all cursor-pointer"
          title="Reset to default payload"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* API Status Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#1e293b] border border-[#334155]">
          {serverOnline ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-[11px]">API Online</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium text-[11px]">Fallback Mode</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
