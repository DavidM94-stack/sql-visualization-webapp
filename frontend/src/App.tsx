import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { EditorPanel } from './components/EditorPanel';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { DEFAULT_SAMPLES, DEFAULT_RAW_SQL } from './utils/samplePlans';
import { AnalyzeResponse, PlanNodeData } from './types/plan';
import { Node, Edge } from '@xyflow/react';

export const App: React.FC = () => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('unindexed_seq_scan');
  const [jsonPayload, setJsonPayload] = useState<string>(
    JSON.stringify(DEFAULT_SAMPLES[0].content, null, 2)
  );
  const [sqlQuery, setSqlQuery] = useState<string>(DEFAULT_RAW_SQL);
  const [sampleList, setSampleList] = useState<Array<{ id: string; title: string }>>(
    DEFAULT_SAMPLES.map(s => ({ id: s.id, title: s.title }))
  );
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<PlanNodeData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(false);

  // Check health and load samples from FastAPI backend
  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => {
        if (res.ok) setServerOnline(true);
      })
      .catch(() => setServerOnline(false));

    fetch('/api/v1/samples')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSampleList(data.map((s) => ({ id: s.id, title: s.title })));
        }
      })
      .catch(() => {});
  }, []);

  // Client-side fallback parser in case backend isn't ready
  const runClientSideAnalysis = useCallback((rawJson: any): AnalyzeResponse => {
    let root = rawJson;
    if (Array.isArray(rawJson) && rawJson.length > 0) root = rawJson[0].Plan || rawJson[0];
    else if (rawJson.Plan) root = rawJson.Plan;

    let nodeCount = 0;
    const nodes: any[] = [];
    const edges: any[] = [];
    const recommendations: any[] = [];

    const rootCost = root["Total Cost"] || 1000.0;
    const rootTime = root["Actual Total Time"] || 50.0;

    const traverse = (nodeDict: any, parentId: string | null = null): string => {
      nodeCount++;
      const nodeId = `node_${nodeCount}`;
      const nodeType = nodeDict["Node Type"] || "Unknown";
      const relationName = nodeDict["Relation Name"];
      const actualRows = nodeDict["Actual Rows"] || 0;
      const planRows = nodeDict["Plan Rows"] || 0;
      const actualTotalTime = nodeDict["Actual Total Time"] || 0.0;
      const totalCost = nodeDict["Total Cost"] || 0.0;
      const sharedHitBlocks = nodeDict["Shared Hit Blocks"] || 0;
      const sharedReadBlocks = nodeDict["Shared Read Blocks"] || 0;
      const filterCond = nodeDict["Filter"];
      const rowsRemovedByFilter = nodeDict["Rows Removed by Filter"] || 0;

      const costPercentage = Math.round((totalCost / rootCost) * 1000) / 10;

      // Heuristics
      const violations: any[] = [];
      if (nodeType.includes("Seq Scan") && actualRows > 1000) {
        const table = relationName || "table";
        const v = {
          rule_id: "RULE_01",
          severity: "critical",
          title: `Unindexed Sequential Scan on '${table}'`,
          description: `Full scan on '${table}' processing ${actualRows.toLocaleString()} rows.`,
          recommendation: `Create an index on ${table} for filtered predicate columns.`,
          sql_remediation: `CREATE INDEX idx_${table}_filter ON ${table} (status);`
        };
        violations.push(v);
        recommendations.push(v);
      }

      if (planRows > 0 && Math.abs(actualRows - planRows) / planRows > 10 && actualRows > 100) {
        const table = relationName || "table";
        const v = {
          rule_id: "RULE_02",
          severity: "high",
          title: `Severe Row Estimate Variance (${(actualRows / planRows).toFixed(1)}x)`,
          description: `Planner expected ${planRows} rows, actually processed ${actualRows} rows.`,
          recommendation: `Update statistics by running ANALYZE ${table};`,
          sql_remediation: `ANALYZE ${table};`
        };
        violations.push(v);
        recommendations.push(v);
      }

      if (sharedReadBlocks > (sharedHitBlocks * 2) && sharedReadBlocks > 50) {
        const v = {
          rule_id: "RULE_03",
          severity: "medium",
          title: `High Disk I/O Bottleneck (${sharedReadBlocks} reads)`,
          description: `Disk read blocks exceed RAM cache hits by >2x.`,
          recommendation: `Increase shared_buffers or add covering index.`,
          sql_remediation: `-- Increase shared_buffers in postgresql.conf`
        };
        violations.push(v);
        recommendations.push(v);
      }

      let severity = 'low';
      if (costPercentage > 50 || violations.some(v => v.severity === 'critical')) severity = 'critical';
      else if (costPercentage >= 20 || violations.length > 0) severity = 'medium';

      const label = relationName ? `${nodeType} on ${relationName}` : nodeType;

      nodes.push({
        id: nodeId,
        type: 'executionNode',
        position: { x: 0, y: 0 },
        data: {
          label,
          nodeType,
          relationName,
          totalCost,
          costPercentage,
          actualTotalTime,
          actualRows,
          planRows,
          sharedHitBlocks,
          sharedReadBlocks,
          filterCond,
          rowsRemovedByFilter,
          severity,
          violations
        }
      });

      if (parentId) {
        let edgeStyle = {};
        if (severity === 'critical') edgeStyle = { stroke: '#ef4444', strokeWidth: 3 };
        else if (severity === 'medium') edgeStyle = { stroke: '#f59e0b', strokeWidth: 2 };

        edges.push({
          id: `edge_${parentId}_${nodeId}`,
          source: parentId,
          target: nodeId,
          animated: severity === 'critical',
          style: edgeStyle,
          label: `${actualRows.toLocaleString()} rows`
        });
      }

      const plans = nodeDict.Plans || [];
      for (const childDict of plans) {
        traverse(childDict, nodeId);
      }

      return nodeId;
    };

    traverse(root, null);

    const criticalCount = nodes.filter(n => n.data.severity === 'critical').length;
    const highCostCount = nodes.filter(n => n.data.costPercentage > 40).length;

    return {
      summary: {
        total_nodes: nodes.length,
        total_cost: rootCost,
        total_actual_time_ms: rootTime,
        critical_bottlenecks: criticalCount,
        high_cost_nodes: highCostCount,
        total_read_blocks: nodes.reduce((acc, n) => acc + n.data.sharedReadBlocks, 0),
        total_hit_blocks: nodes.reduce((acc, n) => acc + n.data.sharedHitBlocks, 0),
        cache_hit_ratio: 95.5
      },
      nodes,
      edges,
      recommendations
    };
  }, []);

  // Analyze JSON EXPLAIN Payload
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setSelectedNodeData(null);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(jsonPayload);
    } catch (e) {
      alert("Invalid JSON format in EXPLAIN payload editor. Please check JSON syntax.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: parsedPayload }),
      });

      if (response.ok) {
        const data: AnalyzeResponse = await response.json();
        setAnalysisResult(data);
        setServerOnline(true);
      } else {
        const fallback = runClientSideAnalysis(parsedPayload);
        setAnalysisResult(fallback);
      }
    } catch (err) {
      const fallback = runClientSideAnalysis(parsedPayload);
      setAnalysisResult(fallback);
      setServerOnline(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [jsonPayload, runClientSideAnalysis]);

  // Direct SQL Execution & EXPLAIN generation
  const handleAnalyzeSql = useCallback(async () => {
    if (!sqlQuery.trim()) {
      alert("Please enter a valid SQL query to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setSelectedNodeData(null);

    try {
      const response = await fetch('/api/v1/analyze-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data);
        setServerOnline(true);
        if (data.generated_json_payload) {
          setJsonPayload(data.generated_json_payload);
        }
      } else {
        alert(data.detail || "Failed to execute SQL query against PostgreSQL.");
      }
    } catch (err) {
      alert("Backend API is currently offline. Please ensure 'python main.py' is running.");
      setServerOnline(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sqlQuery]);

  // Initial trigger on component mount
  useEffect(() => {
    handleAnalyze();
  }, []);

  // Select Sample Preset
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const found = DEFAULT_SAMPLES.find((s) => s.id === sampleId);
    if (found) {
      const formatted = JSON.stringify(found.content, null, 2);
      setJsonPayload(formatted);
      setTimeout(() => {
        handleAnalyze();
      }, 50);
    }
  };

  const handleReset = () => {
    handleSelectSample('unindexed_seq_scan');
  };

  const handleFormatJson = () => {
    try {
      const obj = JSON.parse(jsonPayload);
      setJsonPayload(JSON.stringify(obj, null, 2));
    } catch (e) {
      alert("Invalid JSON syntax.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#090d16] text-[#f8fafc] overflow-hidden">
      {/* App Top Header Bar */}
      <Header
        onAnalyze={handleAnalyze}
        onReset={handleReset}
        onSelectSample={handleSelectSample}
        sampleList={sampleList}
        selectedSampleId={selectedSampleId}
        isAnalyzing={isAnalyzing}
        serverOnline={serverOnline}
      />

      {/* Main Workspace split into 40% Left Panel and 60% Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (40%): Integrated Monaco Code Editor */}
        <div className="w-[40%] h-full shrink-0">
          <EditorPanel
            jsonPayload={jsonPayload}
            onChangeJson={setJsonPayload}
            sqlQuery={sqlQuery}
            onChangeSql={setSqlQuery}
            onFormatJson={handleFormatJson}
            onAnalyzeSql={handleAnalyzeSql}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Right Panel (60%): Summary Dashboard & React Flow Visualizer Canvas */}
        <div className="w-[60%] h-full flex flex-col relative overflow-hidden bg-[#090d16]">
          {/* Summary Metric Cards */}
          <SummaryCards summary={analysisResult?.summary || null} />

          {/* React Flow Graph Area */}
          <div className="flex-1 relative">
            {analysisResult ? (
              <VisualizerCanvas
                initialNodes={analysisResult.nodes as unknown as Node[]}
                initialEdges={analysisResult.edges as unknown as Edge[]}
                onSelectNode={(nodeData) => setSelectedNodeData(nodeData)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Paste an EXPLAIN JSON payload or run a raw SQL query to generate execution graph.
              </div>
            )}

            {/* Slide-over Node Details & SQL Recommendation Drawer */}
            <NodeDetailDrawer
              nodeData={selectedNodeData}
              onClose={() => setSelectedNodeData(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
