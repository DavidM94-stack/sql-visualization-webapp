export const DEFAULT_SAMPLES = [
  {
    id: 'unindexed_seq_scan',
    title: '🚨 Unindexed Seq Scan (Critical)',
    content: [
      {
        "Plan": {
          "Node Type": "Aggregate",
          "Strategy": "Plain",
          "Startup Cost": 14250.00,
          "Total Cost": 14250.01,
          "Plan Rows": 1,
          "Plan Width": 8,
          "Actual Startup Time": 84.120,
          "Actual Total Time": 84.123,
          "Actual Rows": 1,
          "Actual Loops": 1,
          "Shared Hit Blocks": 12,
          "Shared Read Blocks": 3150,
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "orders",
              "Alias": "orders",
              "Startup Cost": 0.00,
              "Total Cost": 13000.00,
              "Plan Rows": 50000,
              "Plan Width": 8,
              "Actual Startup Time": 0.045,
              "Actual Total Time": 79.450,
              "Actual Rows": 52310,
              "Actual Loops": 1,
              "Shared Hit Blocks": 12,
              "Shared Read Blocks": 3150,
              "Filter": "(status = 'PENDING'::text)",
              "Rows Removed by Filter": 447690
            }
          ]
        },
        "Planning Time": 0.150,
        "Execution Time": 84.210
      }
    ]
  },
  {
    id: 'stale_statistics',
    title: '⚠️ Stale Statistics (10x Row Variance)',
    content: [
      {
        "Plan": {
          "Node Type": "Hash Join",
          "Join Type": "Inner",
          "Startup Cost": 3120.00,
          "Total Cost": 19850.50,
          "Plan Rows": 150,
          "Plan Width": 64,
          "Actual Startup Time": 18.500,
          "Actual Total Time": 145.800,
          "Actual Rows": 118400,
          "Actual Loops": 1,
          "Hash Cond": "(orders.user_id = users.id)",
          "Shared Hit Blocks": 4200,
          "Shared Read Blocks": 120,
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "orders",
              "Alias": "orders",
              "Startup Cost": 0.00,
              "Total Cost": 12500.00,
              "Plan Rows": 500000,
              "Plan Width": 32,
              "Actual Startup Time": 0.030,
              "Actual Total Time": 62.100,
              "Actual Rows": 500000,
              "Actual Loops": 1,
              "Shared Hit Blocks": 3100,
              "Shared Read Blocks": 50
            },
            {
              "Node Type": "Hash",
              "Startup Cost": 2500.00,
              "Total Cost": 2500.00,
              "Plan Rows": 100000,
              "Plan Width": 32,
              "Actual Startup Time": 18.200,
              "Actual Total Time": 18.200,
              "Actual Rows": 100000,
              "Actual Loops": 1,
              "Shared Hit Blocks": 1100,
              "Shared Read Blocks": 70,
              "Plans": [
                {
                  "Node Type": "Seq Scan",
                  "Relation Name": "users",
                  "Alias": "users",
                  "Startup Cost": 0.00,
                  "Total Cost": 1500.00,
                  "Plan Rows": 100000,
                  "Plan Width": 32,
                  "Actual Startup Time": 0.020,
                  "Actual Total Time": 10.400,
                  "Actual Rows": 100000,
                  "Actual Loops": 1,
                  "Shared Hit Blocks": 1100,
                  "Shared Read Blocks": 70
                }
              ]
            }
          ]
        }
      }
    ]
  },
  {
    id: 'heavy_io_hash_join',
    title: '💾 Heavy Disk I/O Bottleneck',
    content: [
      {
        "Plan": {
          "Node Type": "Nested Loop",
          "Join Type": "Inner",
          "Startup Cost": 0.42,
          "Total Cost": 84200.00,
          "Plan Rows": 12000,
          "Plan Width": 72,
          "Actual Startup Time": 1.200,
          "Actual Total Time": 380.500,
          "Actual Rows": 11500,
          "Actual Loops": 1,
          "Shared Hit Blocks": 120,
          "Shared Read Blocks": 8400,
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "users",
              "Alias": "u",
              "Startup Cost": 0.00,
              "Total Cost": 2200.00,
              "Plan Rows": 1000,
              "Plan Width": 36,
              "Actual Startup Time": 0.050,
              "Actual Total Time": 15.200,
              "Actual Rows": 1000,
              "Actual Loops": 1,
              "Filter": "(status = 'VIP'::text)",
              "Rows Removed by Filter": 99000,
              "Shared Hit Blocks": 40,
              "Shared Read Blocks": 400
            },
            {
              "Node Type": "Index Scan",
              "Index Name": "idx_orders_user_id",
              "Relation Name": "orders",
              "Alias": "o",
              "Startup Cost": 0.42,
              "Total Cost": 81.50,
              "Plan Rows": 12,
              "Plan Width": 36,
              "Actual Startup Time": 0.220,
              "Actual Total Time": 0.350,
              "Actual Rows": 11.5,
              "Actual Loops": 1000,
              "Index Cond": "(user_id = u.id)",
              "Shared Hit Blocks": 80,
              "Shared Read Blocks": 8000
            }
          ]
        }
      }
    ]
  }
];

export const DEFAULT_RAW_SQL = `-- Run this query against seeded PostgreSQL container to get real EXPLAIN payload:

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    u.username, 
    u.email, 
    o.amount, 
    o.status, 
    o.order_date
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'PENDING'
  AND o.order_date >= '2025-01-01';`;
