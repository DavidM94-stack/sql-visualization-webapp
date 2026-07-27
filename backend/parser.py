import json
from typing import Dict, Any, List, Tuple
from models import (
    PlanNode, HeuristicViolation, AnalysisSummary, 
    ReactFlowNode, ReactFlowEdge, ReactFlowNodeData, AnalyzeResponse
)
from heuristics import HeuristicAnalyzer

class PostgresPlanParser:
    """
    Parses Postgres EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) outputs recursively,
    calculates metrics & severity, runs heuristic rules, and formats React Flow DAG data.
    """

    def __init__(self):
        self.node_counter = 0
        self.all_nodes: List[PlanNode] = []
        self.all_violations: List[HeuristicViolation] = []

    def parse_raw(self, raw_input: Any) -> AnalyzeResponse:
        self.node_counter = 0
        self.all_nodes = []
        self.all_violations = []

        # Handle string input
        if isinstance(raw_input, str):
            try:
                raw_input = json.loads(raw_input)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string provided for execution plan.")

        # Extract root Plan dict
        if isinstance(raw_input, list) and len(raw_input) > 0:
            root_dict = raw_input[0].get("Plan", raw_input[0])
        elif isinstance(raw_input, dict):
            root_dict = raw_input.get("Plan", raw_input)
        else:
            raise ValueError("Unexpected JSON payload format. Expected list or object containing 'Plan'.")

        # Step 1: Recursively parse plan node tree
        root_node = self._parse_node(root_dict, parent_id=None)

        # Step 2: Compute relative percentages based on root node
        root_cost = max(root_node.total_cost, 0.0001)
        root_time = max(root_node.actual_total_time, 0.0001)

        self._calculate_percentages_and_severity(root_node, root_cost, root_time)

        # Step 3: Build React Flow graph elements (Nodes & Edges)
        rf_nodes, rf_edges = self._build_react_flow_graph(root_node)

        # Step 4: Compute summary
        summary = self._build_summary(root_node)

        return AnalyzeResponse(
            summary=summary,
            nodes=rf_nodes,
            edges=rf_edges,
            raw_tree=root_node,
            recommendations=self.all_violations
        )

    def _parse_node(self, node_dict: Dict[str, Any], parent_id: str = None) -> PlanNode:
        self.node_counter += 1
        node_id = f"node_{self.node_counter}"

        # Extract stats
        node_type = node_dict.get("Node Type", "Unknown Node")
        relation_name = node_dict.get("Relation Name")
        alias = node_dict.get("Alias")
        index_name = node_dict.get("Index Name")
        startup_cost = float(node_dict.get("Startup Cost", 0.0))
        total_cost = float(node_dict.get("Total Cost", 0.0))
        plan_rows = int(node_dict.get("Plan Rows", 0))
        plan_width = int(node_dict.get("Plan Width", 0))
        actual_startup_time = float(node_dict.get("Actual Startup Time", 0.0))
        actual_total_time = float(node_dict.get("Actual Total Time", 0.0))
        actual_rows = int(node_dict.get("Actual Rows", 0))
        actual_loops = int(node_dict.get("Actual Loops", 1))
        
        shared_hit_blocks = int(node_dict.get("Shared Hit Blocks", 0))
        shared_read_blocks = int(node_dict.get("Shared Read Blocks", 0))
        shared_dirtied_blocks = int(node_dict.get("Shared Dirtied Blocks", 0))
        shared_written_blocks = int(node_dict.get("Shared Written Blocks", 0))

        filter_cond = node_dict.get("Filter")
        rows_removed_by_filter = int(node_dict.get("Rows Removed by Filter", 0))

        plan_node = PlanNode(
            id=node_id,
            node_type=node_type,
            relation_name=relation_name,
            alias=alias,
            index_name=index_name,
            startup_cost=startup_cost,
            total_cost=total_cost,
            plan_rows=plan_rows,
            plan_width=plan_width,
            actual_startup_time=actual_startup_time,
            actual_total_time=actual_total_time,
            actual_rows=actual_rows,
            actual_loops=actual_loops,
            shared_hit_blocks=shared_hit_blocks,
            shared_read_blocks=shared_read_blocks,
            shared_dirtied_blocks=shared_dirtied_blocks,
            shared_written_blocks=shared_written_blocks,
            filter_cond=filter_cond,
            rows_removed_by_filter=rows_removed_by_filter,
            parent_id=parent_id,
            children=[]
        )

        # Parse child nodes
        plans = node_dict.get("Plans", [])
        for child_dict in plans:
            child_node = self._parse_node(child_dict, parent_id=node_id)
            plan_node.children.append(child_node)

        return plan_node

    def _calculate_percentages_and_severity(self, node: PlanNode, root_cost: float, root_time: float):
        node.cost_percentage = round((node.total_cost / root_cost) * 100.0, 1)
        node.time_percentage = round((node.actual_total_time / root_time) * 100.0, 1)

        # Run heuristic analyzer rules
        node.violations = HeuristicAnalyzer.analyze_node(node)
        self.all_violations.extend(node.violations)

        # Determine node severity level for color coding
        has_critical = any(v.severity == "critical" for v in node.violations)
        has_high = any(v.severity == "high" for v in node.violations)

        if node.cost_percentage > 50.0 or has_critical or "Seq Scan" in node.node_type and node.actual_rows > 1000:
            node.severity = "critical"
        elif node.cost_percentage >= 20.0 or has_high or any(v.severity == "medium" for v in node.violations):
            node.severity = "medium"
        else:
            node.severity = "low"

        self.all_nodes.append(node)

        for child in node.children:
            self._calculate_percentages_and_severity(child, root_cost, root_time)

    def _build_react_flow_graph(self, root_node: PlanNode) -> Tuple[List[ReactFlowNode], List[ReactFlowEdge]]:
        rf_nodes: List[ReactFlowNode] = []
        rf_edges: List[ReactFlowEdge] = []

        def traverse(node: PlanNode):
            label = node.node_type
            if node.relation_name:
                label += f" on {node.relation_name}"

            rf_node = ReactFlowNode(
                id=node.id,
                type="executionNode",
                data=ReactFlowNodeData(
                    label=label,
                    nodeType=node.node_type,
                    relationName=node.relation_name,
                    alias=node.alias,
                    totalCost=node.total_cost,
                    costPercentage=node.cost_percentage,
                    actualTotalTime=node.actual_total_time,
                    actualRows=node.actual_rows,
                    planRows=node.plan_rows,
                    sharedHitBlocks=node.shared_hit_blocks,
                    sharedReadBlocks=node.shared_read_blocks,
                    filterCond=node.filter_cond,
                    rowsRemovedByFilter=node.rows_removed_by_filter,
                    severity=node.severity,
                    violations=node.violations
                )
            )
            rf_nodes.append(rf_node)

            for child in node.children:
                edge_style = {}
                is_animated = False
                if child.severity == "critical":
                    edge_style = {"stroke": "#ef4444", "strokeWidth": 3}
                    is_animated = True
                elif child.severity == "medium":
                    edge_style = {"stroke": "#f59e0b", "strokeWidth": 2}

                edge = ReactFlowEdge(
                    id=f"edge_{node.id}_{child.id}",
                    source=node.id,
                    target=child.id,
                    animated=is_animated,
                    style=edge_style,
                    label=f"{child.actual_rows:,} rows"
                )
                rf_edges.append(edge)
                traverse(child)

        traverse(root_node)
        return rf_nodes, rf_edges

    def _build_summary(self, root_node: PlanNode) -> AnalysisSummary:
        total_nodes = len(self.all_nodes)
        critical_count = sum(1 for n in self.all_nodes if n.severity == "critical")
        high_cost_count = sum(1 for n in self.all_nodes if n.cost_percentage > 40.0)

        total_read = sum(n.shared_read_blocks for n in self.all_nodes)
        total_hit = sum(n.shared_hit_blocks for n in self.all_nodes)

        cache_ratio = 100.0
        if (total_read + total_hit) > 0:
            cache_ratio = round((total_hit / float(total_read + total_hit)) * 100.0, 1)

        return AnalysisSummary(
            total_nodes=total_nodes,
            total_cost=root_node.total_cost,
            total_actual_time_ms=root_node.actual_total_time,
            critical_bottlenecks=critical_count,
            high_cost_nodes=high_cost_count,
            total_read_blocks=total_read,
            total_hit_blocks=total_hit,
            cache_hit_ratio=cache_ratio
        )
