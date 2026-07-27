export interface HeuristicViolation {
  rule_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  sql_remediation?: string;
}

export interface PlanNodeData {
  label: string;
  nodeType: string;
  relationName?: string;
  alias?: string;
  totalCost: number;
  costPercentage: number;
  actualTotalTime: number;
  actualRows: number;
  planRows: number;
  sharedHitBlocks: number;
  sharedReadBlocks: number;
  filterCond?: string;
  rowsRemovedByFilter: number;
  severity: 'critical' | 'medium' | 'low';
  violations: HeuristicViolation[];
}

export interface AnalysisSummary {
  total_nodes: number;
  total_cost: number;
  total_actual_time_ms: number;
  critical_bottlenecks: number;
  high_cost_nodes: number;
  total_read_blocks: number;
  total_hit_blocks: number;
  cache_hit_ratio: number;
}

export interface AnalyzeResponse {
  summary: AnalysisSummary;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: PlanNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: Record<string, any>;
    label?: string;
  }>;
  recommendations: HeuristicViolation[];
}
