from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HeuristicViolation(BaseModel):
    rule_id: str
    severity: str  # "critical", "high", "medium", "low"
    title: str
    description: str
    recommendation: str
    sql_remediation: Optional[str] = None

class PlanNode(BaseModel):
    id: str
    node_type: str
    relation_name: Optional[str] = None
    alias: Optional[str] = None
    index_name: Optional[str] = None
    startup_cost: float = 0.0
    total_cost: float = 0.0
    plan_rows: int = 0
    plan_width: int = 0
    actual_startup_time: float = 0.0
    actual_total_time: float = 0.0
    actual_rows: int = 0
    actual_loops: int = 1
    shared_hit_blocks: int = 0
    shared_read_blocks: int = 0
    shared_dirtied_blocks: int = 0
    shared_written_blocks: int = 0
    filter_cond: Optional[str] = None
    rows_removed_by_filter: int = 0
    cost_percentage: float = 0.0
    time_percentage: float = 0.0
    severity: str = "low"  # "critical", "medium", "low"
    violations: List[HeuristicViolation] = Field(default_factory=list)
    parent_id: Optional[str] = None
    children: List['PlanNode'] = Field(default_factory=list)

class AnalysisSummary(BaseModel):
    total_nodes: int = 0
    total_cost: float = 0.0
    total_actual_time_ms: float = 0.0
    critical_bottlenecks: int = 0
    high_cost_nodes: int = 0
    total_read_blocks: int = 0
    total_hit_blocks: int = 0
    cache_hit_ratio: float = 100.0

class ReactFlowNodeData(BaseModel):
    label: str
    nodeType: str
    relationName: Optional[str] = None
    alias: Optional[str] = None
    totalCost: float
    costPercentage: float
    actualTotalTime: float
    actualRows: int
    planRows: int
    sharedHitBlocks: int
    sharedReadBlocks: int
    filterCond: Optional[str] = None
    rowsRemovedByFilter: int = 0
    severity: str
    violations: List[HeuristicViolation]

class ReactFlowNode(BaseModel):
    id: str
    type: str = "executionNode"
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})
    data: ReactFlowNodeData

class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = False
    style: Dict[str, Any] = Field(default_factory=dict)
    label: Optional[str] = None

class AnalyzeRequest(BaseModel):
    plan: Any  # raw JSON plan string or dict

class AnalyzeSqlRequest(BaseModel):
    sql: str
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "sqldb"
    db_user: str = "postgres"
    db_password: str = "postgres"

class AnalyzeResponse(BaseModel):
    summary: AnalysisSummary
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]
    raw_tree: PlanNode
    recommendations: List[HeuristicViolation]
    generated_json_payload: Optional[str] = None
