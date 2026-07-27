import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import { LayoutGrid, ArrowDown, ArrowRight, Layers } from 'lucide-react';
import { ExecutionNode } from './ExecutionNode';
import { getLayoutedElements } from '../utils/layout';

const nodeTypes = {
  executionNode: ExecutionNode,
};

interface VisualizerCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onSelectNode: (nodeData: any) => void;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  initialNodes,
  initialEdges,
  onSelectNode
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');

  // Re-layout elements whenever initialNodes or layout direction changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      const layouted = getLayoutedElements(initialNodes, initialEdges, direction);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    }
  }, [initialNodes, initialEdges, direction, setNodes, setEdges]);

  const toggleDirection = (newDir: 'TB' | 'LR') => {
    setDirection(newDir);
  };

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.data);
    },
    [onSelectNode]
  );

  return (
    <div className="h-full w-full relative bg-[#090d16] flex flex-col">
      {/* Top Floating Toolbar & Legend */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-[#0f172a]/90 backdrop-blur-md p-2 rounded-xl border border-[#334155] shadow-xl">
        {/* Layout Direction Switcher */}
        <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-lg">
          <button
            onClick={() => toggleDirection('TB')}
            className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded transition-all cursor-pointer ${
              direction === 'TB'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Top-to-Bottom Layout"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Vertical
          </button>
          <button
            onClick={() => toggleDirection('LR')}
            className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded transition-all cursor-pointer ${
              direction === 'LR'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Left-to-Right Layout"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Horizontal
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-300 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            &lt;20% Cost
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            20%-50% Cost
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse" />
            &gt;50% / Seq Scan
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
        <Controls position="bottom-left" />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as any;
            if (data?.severity === 'critical') return '#ef4444';
            if (data?.severity === 'medium') return '#f59e0b';
            return '#10b981';
          }}
          maskColor="rgba(9, 13, 22, 0.7)"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
};
