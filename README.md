# 🔍 SQL Query Visualizer & Performance Analyzer

> **Understand exactly why your PostgreSQL queries are slow — visually.**

A full-stack developer tool that parses PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` execution plans, runs automated performance heuristics, and renders an interactive color-coded DAG (Directed Acyclic Graph) of the query execution tree — with actionable optimization recommendations.

Available as a **single self-contained Windows executable** (`SqlPlanVisualizer.exe`) — no Python or Node.js installation required.

---

## 📸 Features at a Glance

- 🌳 **Interactive Execution Plan DAG** — Visual node graph of every step in your query plan
- 🎨 **Severity Color Coding** — Instantly spot bottlenecks by color (Critical / High / Medium / Info)
- 🤖 **Automated Heuristic Engine** — 4 built-in rules that flag issues and generate fix scripts
- 📋 **Node Detail Drawer** — Click any node for full metrics + copyable `CREATE INDEX` / `ANALYZE` SQL
- ⚡ **Live SQL Execution** — Connect to PostgreSQL and analyze raw queries in real time
- 📝 **JSON Plan Paste** — Paste raw `EXPLAIN` JSON output directly for offline analysis
- 🧪 **Built-in Sample Plans** — 3 pre-loaded examples to explore immediately

---

## 🚀 Quick Start (Executable — Recommended)

### Prerequisites
- Windows 10 or 11
- No Python or Node.js needed

### Run the App

1. Navigate to the `backend/dist/` folder
2. **Double-click** `SqlPlanVisualizer.exe`
3. Your browser automatically opens at **`http://localhost:8000`**
4. Press `CTRL+C` in the console window to stop

```
backend\dist\SqlPlanVisualizer.exe
```

> 💡 The console window shows live server logs. Keep it open while using the app.

---

## 🐳 Quick Start (Development Mode)

For development or if you want to run from source:

### 1. Start the Demo PostgreSQL Database (Optional)

```bash
docker compose up -d
```

Seeds a PostgreSQL 15 container on port `5432` with:
- **100,000 users** (unindexed `email` column)
- **500,000 orders** (unindexed `user_id` foreign key, unindexed `status` column)

Credentials:
```
host:     localhost
port:     5432
database: sqldb
user:     postgres
password: postgres
```

### 2. Start the Backend API

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API runs at `http://localhost:8000`

### 3. Start the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗂 Project Structure

```
sql-plan-visualizer/
├── README.md
├── docker-compose.yml          # PostgreSQL dev container
├── seed.sql                    # 100k users + 500k orders seed data
│
├── backend/
│   ├── main.py                 # FastAPI application & API routes
│   ├── parser.py               # PostgresPlanParser (recursive tree walker)
│   ├── heuristics.py           # Automated performance heuristic rules
│   ├── models.py               # Pydantic request/response models
│   ├── app_launcher.py         # Exe entry point (uvicorn + browser open)
│   ├── SqlPlanVisualizer.spec  # PyInstaller build config
│   ├── requirements.txt
│   ├── samples/                # Pre-built sample EXPLAIN JSON plans
│   └── dist/
│       └── SqlPlanVisualizer.exe   ← Single Windows executable (~38MB)
│
└── frontend/
    ├── src/
    │   ├── App.tsx             # Main dashboard component
    │   └── ...
    ├── package.json
    └── vite.config.ts
```

---

## 🔌 API Reference

All endpoints are available at `http://localhost:8000`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/health` | Health check |
| `POST` | `/api/v1/analyze` | Parse a raw EXPLAIN JSON plan |
| `POST` | `/api/v1/analyze-sql` | Execute SQL + return live plan |
| `GET`  | `/api/v1/samples` | Return pre-built sample plans |
| `GET`  | `/docs` | Interactive Swagger UI |

### POST /api/v1/analyze

Accepts a raw PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` JSON payload.

```json
{
  "plan": [ { "Plan": { "Node Type": "Seq Scan", ... } } ]
}
```

### POST /api/v1/analyze-sql

Executes a SQL query against a live PostgreSQL instance and returns the parsed plan.

```json
{
  "sql": "SELECT * FROM orders WHERE status = 'PENDING'",
  "db_host": "localhost",
  "db_port": 5432,
  "db_name": "sqldb",
  "db_user": "postgres",
  "db_password": "postgres"
}
```

---

## 🤖 Heuristic Rules

The analyzer automatically applies these rules to every node in the execution plan:

| Rule | Severity | Trigger | Recommendation |
|------|----------|---------|----------------|
| **RULE_01** | 🔴 Critical | `Seq Scan` with `actual_rows > 1000` | `CREATE INDEX` on the filter column |
| **RULE_02** | 🟠 High | Row estimate variance `> 10×` (`actual / plan`) | `ANALYZE <table>` to refresh statistics |
| **RULE_03** | 🟡 Medium | Disk reads > 2× RAM cache hits | Increase `work_mem`; check `shared_buffers` |
| **RULE_04** | 🟡 Medium | `rows_removed_by_filter > 5000` | Add partial or composite index |

Each triggered rule generates a **ready-to-copy SQL script** shown in the Node Detail Drawer.

---

## 🎨 Severity Color Coding

| Color | Label | Meaning |
|-------|-------|---------|
| 🔴 Red | Critical | Unindexed sequential scan or major bottleneck |
| 🟠 Orange | High | Stale statistics or severe row estimate mismatch |
| 🟡 Yellow | Medium | Disk I/O or heavy filter rejection |
| 🔵 Blue | Info | High relative cost node (>40% of total) |
| 🟢 Green | Healthy | No issues detected |

---

## 🧪 Sample Plans

Three sample execution plans are bundled and immediately usable from the dropdown in the UI:

1. **🚨 Unindexed Seq Scan (Critical)** — Sequential scan over 500k `orders` rows filtering by `status = 'PENDING'`. Triggers RULE_01 and RULE_04.
2. **⚠️ Stale Statistics (High)** — Planner expected 150 rows, actually fetched 118,400. Triggers RULE_02.
3. **💾 Heavy Disk I/O (Medium)** — High disk buffer reads with low cache hit ratio. Triggers RULE_03.

---

## 🏗 Building the Executable

To recompile the executable from source:

```bash
# 1. Build the React frontend
cd frontend
npm install
npm run build

# 2. Compile the executable
cd ../backend
pip install pyinstaller
pyinstaller SqlPlanVisualizer.spec
```

Output: `backend/dist/SqlPlanVisualizer.exe`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Live SQL | asyncpg (async PostgreSQL driver) |
| Frontend | React 18, TypeScript, Vite |
| Graph | @xyflow/react (React Flow), Dagre layout |
| Editor | Monaco Editor |
| Styling | Tailwind CSS |
| Packaging | PyInstaller (single-file exe) |
| Database | PostgreSQL 15 (Docker) |

---

## 📋 Requirements

### Executable Mode
- Windows 10 / 11 (x64)
- No additional dependencies

### Development Mode
- Python 3.11+
- Node.js 18+
- Docker Desktop (for the seed database)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Direct download link: https://github.com/DavidM94-stack/sql-visualization-webapp/releases/download/v1.0.0/SqlPlanVisualizer.exe
