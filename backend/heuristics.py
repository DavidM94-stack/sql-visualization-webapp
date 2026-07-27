import re
from typing import List, Optional
from models import PlanNode, HeuristicViolation

class HeuristicAnalyzer:
    """
    Evaluates execution plan nodes against automated database performance rules
    and generates actionable recommendations & SQL remediation scripts.
    """

    @staticmethod
    def analyze_node(node: PlanNode) -> List[HeuristicViolation]:
        violations: List[HeuristicViolation] = []

        # RULE_01 (Critical): Flag Seq Scan where actual_rows > 1000
        if "Seq Scan" in node.node_type and node.actual_rows > 1000:
            table_name = node.relation_name or node.alias or "table"
            filter_str = node.filter_cond or ""
            col_match = re.findall(r'\(?([a-zA-Z0-9_]+)\s*(?:=|>|<|IS|IN|LIKE)', filter_str)
            target_col = col_match[0] if col_match else "column_name"
            
            sql_script = f"CREATE INDEX idx_{table_name}_{target_col} ON {table_name} ({target_col});"
            
            violations.append(HeuristicViolation(
                rule_id="RULE_01",
                severity="critical",
                title=f"Unindexed Sequential Scan on '{table_name}'",
                description=(
                    f"Table '{table_name}' performed a full Sequential Scan fetching {node.actual_rows:,} rows. "
                    f"Sequential scans on large tables cause high CPU and I/O overhead."
                ),
                recommendation=f"Create a B-tree index on '{table_name}' for filtered columns to enable fast Index Scans.",
                sql_remediation=sql_script
            ))

        # RULE_02 (High): Row estimation variance > 10x
        denom = max(node.plan_rows, 1)
        variance = abs(node.actual_rows - node.plan_rows) / float(denom)
        if variance > 10.0 and node.actual_rows > 100:
            table_name = node.relation_name or node.alias or "table"
            sql_script = f"ANALYZE {table_name};" if table_name != "table" else "ANALYZE;"
            
            violations.append(HeuristicViolation(
                rule_id="RULE_02",
                severity="high",
                title=f"Severe Row Estimation Misestimate ({variance:.1f}x)",
                description=(
                    f"PostgreSQL estimated {node.plan_rows:,} rows, but actually processed {node.actual_rows:,} rows. "
                    f"Outdated table statistics cause the query planner to choose suboptimal join strategies or scan paths."
                ),
                recommendation=f"Update table statistics by executing ANALYZE on table '{table_name}'.",
                sql_remediation=sql_script
            ))

        # RULE_03 (Medium): High Disk Read vs Cache Hit Ratio (shared_read_blocks > shared_hit_blocks * 2)
        if node.shared_read_blocks > (node.shared_hit_blocks * 2) and node.shared_read_blocks > 50:
            table_name = node.relation_name or node.alias or "data pages"
            violations.append(HeuristicViolation(
                rule_id="RULE_03",
                severity="medium",
                title="High Disk I/O Bottleneck (Buffer Cache Misses)",
                description=(
                    f"Node read {node.shared_read_blocks} blocks from disk vs only {node.shared_hit_blocks} blocks from RAM cache. "
                    f"Reading data from disk introduces severe latency."
                ),
                recommendation="Consider increasing PostgreSQL `shared_buffers` or adding covering indexes to fit queries in RAM.",
                sql_remediation="-- Adjust postgresql.conf:\n-- shared_buffers = '1GB'  # or 25% of total RAM"
            ))

        # Additional RULE_04: Heavy Filter Exclusion
        if node.rows_removed_by_filter > 5000:
            table_name = node.relation_name or node.alias or "table"
            violations.append(HeuristicViolation(
                rule_id="RULE_04",
                severity="medium",
                title=f"High Filter Rejection ({node.rows_removed_by_filter:,} rows discarded)",
                description=f"The database had to read and discard {node.rows_removed_by_filter:,} rows due to filter criteria.",
                recommendation=f"Ensure indexes cover the filter condition on table '{table_name}'.",
                sql_remediation=f"-- Check query predicates for table {table_name} and add filtered/partial indexes."
            ))

        return violations
