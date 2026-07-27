# PostgreSQL Query Visualizer & Performance Analyzer - Complete User Manual

Welcome to the **PostgreSQL Query Visualizer & Performance Analyzer** manual. This guide explains how to use the interactive dashboard, analyze raw SQL queries automatically, inspect execution DAG trees, evaluate automated performance heuristics, and apply copyable SQL index recommendations.

---

## 🎯 Quick Reference Summary

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:8000](http://localhost:8000)
- **PostgreSQL Database Container:** `localhost:5432` (`POSTGRES_DB=sqldb`, `user=postgres`, `password=postgres`)

---

## 🛠️ Operating Modes: How to Analyze Queries

The application supports **two workflow modes**:

### Method A: Automated Direct SQL Execution (Recommended)

1. Open the Dashboard at [http://localhost:5173](http://localhost:5173).
2. In the **Left Panel (40%)**, click the **`Raw SQL Query`** tab.
3. Paste or type your raw PostgreSQL query (e.g. `SELECT * FROM orders WHERE status = 'PENDING';`).
4. Click the **`Run & Analyze SQL`** button in the top right of the editor.
5. The application will:
   - Connect directly to your local PostgreSQL container (`docker compose up -d`).
   - Automatically execute `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ...`.
   - Retrieve the live execution tree and automatically populate the **`EXPLAIN JSON Plan`** tab.
   - Render the interactive DAG graph and generate performance heuristics.

*Note: If PostgreSQL is offline, a clear message will notify you to launch the container via `docker compose up -d`.*

---

### Method B: Manual EXPLAIN JSON Payload Analysis

If you are working with an existing PostgreSQL database on a remote server or staging environment:

1. Connect to your database using `psql`, pgAdmin, DBeaver, or DataGrip.
2. Prefix your query with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`:
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
   SELECT u.username, o.amount, o.status
   FROM users u
   JOIN orders o ON u.id = o.user_id
   WHERE o.status = 'PENDING';
   ```
3. Copy the resulting JSON payload.
4. Open the Web Dashboard, select the **`EXPLAIN JSON Plan`** tab in the Left Panel, and paste the payload.
5. Click **`Format`** to prettify the JSON formatting.
6. Click **`Analyze Plan`** in the top navigation bar.

---

## 📊 Understanding the Dashboard Interface

```
+---------------------------------------------------------------------------------------------------+
|  SQL Query Visualizer [PostgreSQL Engine]   Sample Plan: [Preset V]   (Analyze Plan) (API Online)  |
+---------------------------------------------------------------------------------------------------+
|  LEFT PANEL (40%)                       |  RIGHT PANEL (60%)                                      |
|  [EXPLAIN JSON Plan] [Raw SQL Query]    |  +----------------------------------------------------+ |
|  -------------------------------------  |  | Total Time: 84.1ms | Root Cost: 14250 | Bottlenecks | |
|  1: [                                   |  +----------------------------------------------------+ |
|  2:   {                                 |  | [Vertical V] [Horizontal]  <20% Cost 20-50% >50%    | |
|  3:     "Plan": {                       |  |                                                    | |
|  4:       "Node Type": "Seq Scan",      |  |         [Aggregate Node (14250.01)]                | |
|  5:       "Relation Name": "orders",    |  |                      |                             | |
|  6:       "Actual Rows": 52310          |  |                      v                             | |
|  ...                                    |  |         [Seq Scan on orders (🔴 91.2% Cost)]       | |
|                                         |  +----------------------------------------------------+ |
|                                         |  | SLIDE-OVER DRAWER (Selected Node Metrics & SQL Fix)| |
+---------------------------------------------------------------------------------------------------+
```

### 1. Summary Cards Bar (Top Right)
Displays key high-level execution statistics:
- **Total Execution Time (ms):** Total wall-clock time spent executing the query.
- **Root Node Cost:** Cumulative cost score computed by the PostgreSQL query planner.
- **Critical Bottlenecks:** Count of execution steps flagged with critical severity (e.g. unindexed Sequential Scans).
- **RAM Cache Hit Ratio (%):** Percentage of data pages read from RAM cache (`Shared Hit Blocks`) versus disk (`Shared Read Blocks`).

---

### 2. Interactive React Flow Canvas
- **Color-Coded Severity Nodes:**
  - 🟢 **Green (< 20% Cost):** Fast, optimal execution step.
  - 🟡 **Yellow (20% - 50% Cost):** Moderate cost impact or minor buffer cache miss.
  - 🔴 **Red (> 50% Cost / Seq Scan):** High-cost execution bottleneck with animated glow.
- **Layout Toggles:** Switch between **Vertical** (top-to-bottom) and **Horizontal** (left-to-right) DAG orientation.
- **Controls & MiniMap:** Use zoom in/out, fit-view buttons, and bottom-right overview MiniMap to navigate large complex execution trees.

---

### 3. Node Detail & SQL Remediation Slide-Over Drawer
Clicking any node in the graph opens the right-hand slide-over drawer:
- **Metrics Breakdown:** Actual rows processed vs. planner estimated rows, row count variance ratio, startup time, and actual total time.
- **Buffer I/O Statistics:** RAM Hit Blocks vs Disk Read Blocks.
- **Filter Predicate:** Displays `Filter` expressions and count of discarded non-matching rows.
- **Actionable Optimization Recommendations & Copyable SQL:**
  - **RULE_01 (Critical - Unindexed Seq Scan):** Recommends index creation:
    ```sql
    CREATE INDEX idx_orders_status ON orders (status);
    ```
    *(Click **Copy SQL** to copy the script directly to your clipboard!)*
  - **RULE_02 (High - Stale Statistics):** Recommends statistic updating:
    ```sql
    ANALYZE orders;
    ```
  - **RULE_03 (Medium - Disk I/O Bottleneck):** Recommends RAM buffer adjustments.

---

## 🧪 Testing Seeded Bottleneck Queries

To test real bottleneck queries against the 600,000-row database:

1. Ensure the docker container is active: `docker compose up -d`
2. In the **`Raw SQL Query`** tab, paste any of the following queries:

#### Test Query 1: Unindexed Sequential Scan
```sql
SELECT COUNT(*), SUM(amount) 
FROM orders 
WHERE status = 'PENDING' 
  AND order_date >= '2025-01-01';
```

#### Test Query 2: Heavy Join without Foreign Key Index
```sql
SELECT u.username, u.email, o.amount, o.status 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.status = 'ACTIVE';
```

3. Click **`Run & Analyze SQL`**. Watch the graph automatically render and reveal red severity bottleneck nodes with index recommendations!
