# git-setup.ps1
# Run this script once to initialize the repo and link it to GitHub.
# Usage:
#   .\git-setup.ps1 -GithubUrl "https://github.com/YOUR_USERNAME/YOUR_REPO.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$GithubUrl
)

$ErrorActionPreference = "Stop"
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  SQL Plan Visualizer — Git Repository Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Init
Write-Host "[1/5] Initializing Git repository..." -ForegroundColor Yellow
git init
git branch -M main

# 2. Stage all files
Write-Host "[2/5] Staging all project files..." -ForegroundColor Yellow
git add .

# 3. Show what will be committed
Write-Host ""
Write-Host "[3/5] Files staged for first commit:" -ForegroundColor Yellow
git status --short

# 4. First commit
Write-Host ""
Write-Host "[4/5] Creating initial commit..." -ForegroundColor Yellow
git commit -m "feat: initial commit — SQL Query Visualizer & Performance Analyzer

- FastAPI backend with PostgresPlanParser (recursive EXPLAIN JSON walker)
- 4 automated heuristic rules (Seq Scan, row variance, disk I/O, filter rejection)
- React + TypeScript + React Flow interactive DAG visualizer
- Live SQL execution via asyncpg
- Node detail drawer with copyable SQL fix scripts
- 3 built-in sample execution plans
- Docker Compose seed environment (100k users, 500k orders)
- PyInstaller single-file Windows executable (SqlPlanVisualizer.exe)"

# 5. Link to GitHub
Write-Host ""
Write-Host "[5/5] Linking to GitHub remote: $GithubUrl" -ForegroundColor Yellow
git remote add origin $GithubUrl
git push -u origin main

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Done! Repository pushed to GitHub." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your repo: $GithubUrl" -ForegroundColor Cyan
