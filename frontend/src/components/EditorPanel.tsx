import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, FileJson, Sparkles, Copy, Check, Info, Play, Database } from 'lucide-react';
import { DEFAULT_RAW_SQL } from '../utils/samplePlans';

interface EditorPanelProps {
  jsonPayload: string;
  onChangeJson: (value: string) => void;
  sqlQuery: string;
  onChangeSql: (value: string) => void;
  onFormatJson: () => void;
  onAnalyzeSql: () => void;
  isAnalyzing: boolean;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  jsonPayload,
  onChangeJson,
  sqlQuery,
  onChangeSql,
  onFormatJson,
  onAnalyzeSql,
  isAnalyzing
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'sql'>('json');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = activeTab === 'json' ? jsonPayload : sqlQuery;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0f172a] border-r border-[#1e293b]">
      {/* Tab Navigation & Action Bar */}
      <div className="h-12 bg-[#090d16] border-b border-[#1e293b] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            EXPLAIN JSON Plan
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Raw SQL Query
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'json' ? (
            <button
              onClick={onFormatJson}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-[#1e293b] hover:bg-[#334155] px-2.5 py-1 rounded border border-[#334155] transition-all cursor-pointer"
              title="Prettify JSON payload"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Format
            </button>
          ) : (
            <button
              onClick={onAnalyzeSql}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {isAnalyzing ? 'Executing SQL...' : 'Run & Analyze SQL'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-[#1e293b] hover:bg-[#334155] px-2 py-1 rounded border border-[#334155] transition-all cursor-pointer"
            title="Copy editor content"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#090d16]">
        {activeTab === 'json' ? (
          <Editor
            height="100%"
            defaultLanguage="json"
            language="json"
            theme="vs-dark"
            value={jsonPayload}
            onChange={(val) => onChangeJson(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 }
            }}
          />
        ) : (
          <div className="h-full flex flex-col">
            {/* Informative Banner */}
            <div className="bg-[#0f172a] p-3 text-xs border-b border-[#1e293b] text-slate-300 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-300 block">Direct PostgreSQL SQL Execution</span>
                Clicking <strong className="text-white font-mono bg-purple-950 px-1 py-0.5 rounded border border-purple-800">Run & Analyze SQL</strong> will execute your query live against the PostgreSQL container (`docker compose up -d`), automatically fetch `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, and render the visual DAG graph.
              </div>
            </div>

            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="sql"
                language="sql"
                theme="vs-dark"
                value={sqlQuery || DEFAULT_RAW_SQL}
                onChange={(val) => onChangeSql(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
