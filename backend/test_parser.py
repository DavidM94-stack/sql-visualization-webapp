import json
from parser import PostgresPlanParser

def test_parser_unindexed_seq_scan():
    raw = [
        {
            "Plan": {
                "Node Type": "Seq Scan",
                "Relation Name": "orders",
                "Total Cost": 13000.0,
                "Plan Rows": 50000,
                "Actual Rows": 52310,
                "Actual Total Time": 79.45,
                "Filter": "(status = 'PENDING'::text)"
            }
        }
    ]
    parser = PostgresPlanParser()
    result = parser.parse_raw(raw)

    assert result.summary.total_nodes == 1
    assert result.nodes[0].data.severity == "critical"
    assert len(result.recommendations) > 0
    assert result.recommendations[0].rule_id == "RULE_01"
    assert "CREATE INDEX" in result.recommendations[0].sql_remediation

def test_parser_stale_statistics():
    raw = [
        {
            "Plan": {
                "Node Type": "Hash Join",
                "Total Cost": 15000.0,
                "Plan Rows": 100,
                "Actual Rows": 2500,
                "Actual Total Time": 40.0,
                "Relation Name": "orders"
            }
        }
    ]
    parser = PostgresPlanParser()
    result = parser.parse_raw(raw)

    rule_ids = [r.rule_id for r in result.recommendations]
    assert "RULE_02" in rule_ids
    sql_rem = [r.sql_remediation for r in result.recommendations if r.rule_id == "RULE_02"][0]
    assert "ANALYZE" in sql_rem

if __name__ == "__main__":
    test_parser_unindexed_seq_scan()
    test_parser_stale_statistics()
    print("ALL BACKEND PARSER TESTS PASSED SUCCESSFULLY!")
