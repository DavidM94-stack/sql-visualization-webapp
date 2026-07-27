# PostgreSQL Query Visualizer & Performance Analyzer - User & Execution Guide

This document provides step-by-step instructions on how to set up, run, and test the **PostgreSQL Query Visualizer & Performance Analyzer** application on your machine.

---

## 📋 System Prerequisites

Before running the application, ensure you have the following installed:

1. **Python 3.9+** (Check with `python --version`)
2. **Node.js 18+ & npm** (Check with `node --version` and `npm --version`)
3. **Docker & Docker Desktop** (Optional - required only if you want to run real queries against the 600,000-row seeded PostgreSQL container).

---

## 📁 Repository Structure

```
sql-plan-visualizer/
├── docker-compose.yml       # Local PostgreSQL container configuration
├── seed.sql                 # SQL seed data (100k users, 500k orders)
├── README.md                # General technical overview
├── RUNNING_THE_APP.md       # Step-by-step user guide (this file)
├── backend/                 # FastAPI REST API & Heuristics Parsing Engine
│   ├── main.py              # Application entry point (Port 8000)
│   ├── models.py            # Pydantic data schemas
│   ├── parser.py            # Recursive EXPLAIN tree parser
│   ├── heuristics.py        # Database performance rules engine
│   ├── requirements.txt     # Python dependencies
│   └── samples/             # Pre-configured EXPLAIN JSON samples
└── frontend/                # React / TypeScript / Vite Dashboard
    ├── package.json         # Dependencies (@xyflow/react, monaco-editor, tailwind)
    ├── vite.config.ts       # Vite configuration (Port 5173 with /api proxy)
    └── src/
        ├── App.tsx          # Main layout & state manager
        ├── components/      # UI components (Canvas, Editor, Drawer, Cards, Header)
        └── utils/           # Dagre layout & sample plan data
```

---

## 🚀 Step-by-Step Launch Instructions

### Step 1: Start the Local PostgreSQL Seed Container (Optional)

If you want to run real queries and generate fresh `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` plan payloads, spin up the local PostgreSQL container:

```bash
# Navigate to the project root directory
cd sql-plan-visualizer

# Launch the database container in detached mode
docker compose up -d
```

> **Database Credentials:**
> - **Host:** `localhost`
> - **Port:** `5432`
> - **Database Name:** `sqldb`
> - **Username:** `postgres`
> - **Password:** `postgres`
> 
> *The seed script (`seed.sql`) automatically populates 100,000 users and 500,000 orders with unindexed foreign keys upon container initialization.*

---

### Step 2: Launch the FastAPI Backend Server

1. Open a terminal window and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. Install the required Python packages (if not already installed):
   ```bash
   python -m pip install -r requirements.txt
   ```

3. Start the FastAPI development server:
   ```bash
   python main.py
   ```
   *or using Uvicorn directly:*
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. Verify the backend is running by opening:
   - **Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 3: Launch the React Frontend Dashboard

1. Open a second terminal window and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install NPM dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - **Dashboard URL:** [http://localhost:5173](http://localhost:5173)

---

## 💡 How to Use the Dashboard

### 1. Using Built-in Sample Execution Plans
In the top navigation bar, use the **Sample Plan** dropdown to quickly test pre-loaded performance scenarios:
- **🚨 Unindexed Seq Scan (Critical):** Tests a full table scan over 500,000 orders.
- **⚠️ Stale Statistics (10x Row Variance):** Tests a row estimation misestimate where actual rows exceed planner estimates by >10x.
- **💾 Heavy Disk I/O Bottleneck:** Tests buffer cache misses where disk reads dominate RAM cache hits.

### 2. Testing Your Own PostgreSQL Queries
To analyze your own database queries:

1. Connect to your PostgreSQL database (or the dockerized database) using `psql`, pgAdmin, DBeaver, or VS Code SQL extension:
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
   SELECT u.username, u.email, o.amount, o.status 
   FROM users u
   JOIN orders o ON u.id = o.user_id
   WHERE o.status = 'PENDING';
   ```

2. Copy the resulting JSON output array from your SQL editor.

3. In the Web Dashboard:
   - Make sure the **EXPLAIN JSON Plan** tab is selected in the left panel.
   - Paste the JSON payload into the Monaco Code Editor.
   - Click the **Format** button to prettify the JSON formatting.
   - Click **Analyze Plan**.

4. Inspect the Interactive Visualizer:
   - **DAG Canvas (Right Panel):** View color-coded nodes (Red = Critical Bottleneck, Yellow = Medium Cost, Green = Low Cost).
   - **Node Detail Drawer:** Click on any graph node (especially red or yellow nodes) to open the slide-over drawer displaying timing, buffer hits, filter predicates, and **copyable SQL remediation scripts** (e.g. `CREATE INDEX ...` or `ANALYZE ...`).

---

## 🛠️ Troubleshooting & FAQ

### Q1: The UI shows "Fallback Mode" in the top right header.
- **Cause:** The frontend cannot reach the FastAPI backend on `http://localhost:8000`.
- **Solution:** Ensure `python main.py` is running in the `backend/` directory. Even in Fallback Mode, the dashboard includes a client-side parser engine so you can still analyze plans seamlessly.

### Q2: Docker fails to start or port 5432 is already in use.
- **Cause:** Another local PostgreSQL instance is running on port 5432.
- **Solution:** Either stop your local PostgreSQL service or change the port mapping in `docker-compose.yml` to `"5433:5432"`.

### Q3: How do I change graph layout orientation?
- **Solution:** In the top toolbar above the graph canvas, click **Vertical** for top-to-bottom tree flow or **Horizontal** for left-to-right DAG layout.
