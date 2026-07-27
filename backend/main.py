import os
import sys
import json
import asyncpg
from pathlib import Path
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from models import AnalyzeRequest, AnalyzeSqlRequest, AnalyzeResponse
from parser import PostgresPlanParser

app = FastAPI(
    title="PostgreSQL Query Visualizer & Analyzer API",
    version="1.1.0",
    description="API for parsing PostgreSQL EXPLAIN JSON output and executing raw SQL against PostgreSQL to generate & visualize execution plans."
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine path for samples directory
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).parent

SAMPLES_DIR = BASE_DIR / "samples"
DIST_DIR = BASE_DIR / "dist"

# If local dev environment, check parent frontend/dist
if not DIST_DIR.exists():
    LOCAL_FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
    if LOCAL_FRONTEND_DIST.exists():
        DIST_DIR = LOCAL_FRONTEND_DIST

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": "sql-plan-visualizer-backend"}

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze_plan(request: AnalyzeRequest):
    """
    Parses Postgres EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) output,
    runs automated performance heuristics, and generates React Flow graph nodes.
    """
    try:
        parser = PostgresPlanParser()
        result = parser.parse_raw(request.plan)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze execution plan: {str(e)}")

@app.post("/api/v1/analyze-sql", response_model=AnalyzeResponse)
async def analyze_sql(request: AnalyzeSqlRequest):
    """
    Executes raw SQL query against PostgreSQL container using EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON),
    extracts the live execution plan payload, and returns full visual DAG node graph.
    """
    sql_clean = request.sql.strip().rstrip(";")
    if not sql_clean:
        raise HTTPException(status_code=400, detail="SQL query string cannot be empty.")

    # Prefix with EXPLAIN if not already present
    if not sql_clean.upper().startswith("EXPLAIN"):
        explain_query = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {sql_clean};"
    else:
        explain_query = f"{sql_clean};"

    # Connect to PostgreSQL
    try:
        conn = await asyncpg.connect(
            host=request.db_host,
            port=request.db_port,
            user=request.db_user,
            password=request.db_password,
            database=request.db_name,
            timeout=5.0
        )
    except Exception as db_err:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to PostgreSQL database on {request.db_host}:{request.db_port}. Ensure Docker container is running (`docker compose up -d`). Error: {str(db_err)}"
        )

    try:
        # Execute EXPLAIN query
        records = await conn.fetch(explain_query)
        await conn.close()

        if not records:
            raise HTTPException(status_code=400, detail="PostgreSQL returned empty result for EXPLAIN query.")

        # Extract JSON plan payload
        raw_val = records[0][0]
        if isinstance(raw_val, str):
            plan_data = json.loads(raw_val)
        else:
            plan_data = raw_val

        # Parse & run heuristics
        parser = PostgresPlanParser()
        response = parser.parse_raw(plan_data)
        response.generated_json_payload = json.dumps(plan_data, indent=2)
        return response

    except asyncpg.PostgresError as pg_err:
        await conn.close()
        raise HTTPException(status_code=400, detail=f"PostgreSQL Execution Error: {pg_err.message}")
    except Exception as err:
        if 'conn' in locals() and not conn.is_closed():
            await conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to execute & analyze SQL query: {str(err)}")

@app.get("/api/v1/samples")
def get_sample_plans() -> List[Dict[str, Any]]:
    """
    Returns pre-configured sample EXPLAIN JSON plans for testing.
    """
    samples = []
    if SAMPLES_DIR.exists():
        for sample_file in SAMPLES_DIR.glob("*.json"):
            try:
                with open(sample_file, "r", encoding="utf-8") as f:
                    content = json.load(f)
                    samples.append({
                        "id": sample_file.stem,
                        "title": sample_file.stem.replace("_", " ").title(),
                        "content": content
                    })
            except Exception as e:
                print(f"Error reading sample file {sample_file}: {e}")
    return samples

# Mount static frontend assets if DIST_DIR exists
if DIST_DIR.exists():
    assets_path = DIST_DIR / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
