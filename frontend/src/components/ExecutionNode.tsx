import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AlertCircle, Zap, HardDrive, ShieldCheck, Database } from 'lucide-react';
import { PlanNodeData } from '../types/plan';

export const ExecutionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as PlanNodeData;
  const { 
    nodeType, 
    relationName, 
    costPercentage, 
    actualTotalTime, 
    actualRows, 
    severity, 
    violations 
  } = nodeData;

  // Determine styles by severity
  let borderStyle = 'border-emerald-500/40 bg-slate-900/90 hover:border-emerald-400';
  let badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800';
  let costColor = 'text-emerald-400';
  let pulseEffect = '';

  if (severity === 'critical') {
    borderStyle = 'border-rose-500 bg-rose-950/20 hover:border-rose-400 shadow-lg shadow-rose-950/50';
    badgeBg = 'bg-rose-950 text-rose-300 border-rose-800';
    costColor = 'text-rose-400';
    pulseEffect = 'animate-pulse-red';
  } else if (severity === 'medium') {
    borderStyle = 'border-amber-500/70 bg-amber-950/20 hover:border-amber-400';
    badgeBg = 'bg-amber-950 text-amber-300 border-amber-800';
    costColor = 'text-amber-400';
  }

  const selectionRing = selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-[1.02]' : '';

  return (
    <div
      className={`w-[270px] rounded-xl border-2 p-3 transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-md ${borderStyle} ${selectionRing} ${pulseEffect}`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-900"
      />

      {/* Card Header: Node Type & Severity Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <Database className={`w-4 h-4 shrink-0 ${costColor}`} />
          <span className="font-semibold text-xs text-slate-100 truncate" title={nodeType}>
            {nodeType}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeBg}`}>
          {costPercentage}% COST
        </span>
      </div>

      {/* Target Table Relation */}
      {relationName && (
        <div className="text-[11px] font-mono text-cyan-300 mb-2 truncate bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
          on <span className="font-bold underline text-cyan-200">{relationName}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/40 p-2 rounded-lg border border-slate-800/80 mb-2">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Actual Time</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            {actualTotalTime.toFixed(2)} ms
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Actual Rows</span>
          <span className="font-semibold text-slate-200">
            {actualRows.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Violation Alert Badge */}
      {violations && violations.length > 0 ? (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-300 bg-rose-950/60 px-2 py-1 rounded border border-rose-800/80">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{violations[0].title}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Optimal execution step</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-900"
      />
    </div>
  );
});

ExecutionNode.displayName = 'ExecutionNode';
