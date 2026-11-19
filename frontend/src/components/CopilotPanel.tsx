"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  RefreshCw,
  Info,
  AlertCircle
} from "lucide-react";

interface QuickChip {
  id: string;
  title: string;
  prompt: string;
  category: string;
}

interface ToolTrace {
  tool: string;
  arguments?: any;
  result?: any;
  latency_ms?: number;
  status: "pending" | "running" | "done" | "error";
}

interface Citation {
  id: string;
  source_title: string;
  citation_tag: string;
  category: string;
  summary: string;
  relevance_percentage: string;
}

const DEFAULT_CHIPS: QuickChip[] = [
  {
    id: "chip-1",
    title: "Audit Sundarbans Node",
    prompt: "Audit Sundarbans node telemetry for tampering & verify Article 6 compliance",
    category: "telemetry_audit"
  },
  {
    id: "chip-2",
    title: "Net-Zero 2030 Pathway",
    prompt: "Calculate Net-Zero 2030 pathway for 450 tCO2e/month industrial emitter",
    category: "netzero_pathway"
  },
  {
    id: "chip-3",
    title: "Verify Coastal Inference",
    prompt: "Verify XGBoost MRV inference on high-salinity coastal wetland payload",
    category: "model_inference"
  }
];

export default function CopilotPanel() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [toolTraces, setToolTraces] = useState<ToolTrace[]>([]);
  const [streamedText, setStreamedText] = useState<string>("");
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const responseEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as tokens stream in
  useEffect(() => {
    if (isLoading && responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedText, toolTraces, isLoading]);

  const toggleToolExpand = (index: number) => {
    setExpandedTools((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleRunQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    setIsLoading(true);
    setQuery(queryText);
    setErrorMsg(null);
    setStreamedText("");
    setToolTraces([]);
    setActiveIntent(null);
    setExpandedTools({});

    const backendUrl = "http://127.0.0.1:8000";

    try {
      const response = await fetch(
        `${backendUrl}/copilot/stream?query=${encodeURIComponent(queryText)}`
      );

      if (!response.ok || !response.body) {
        throw new Error(`Server returned ${response.status}: Falling back to sync query`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.slice(6));

              if (data.event === "intent_routed") {
                setActiveIntent(data.label || data.intent);
                if (data.tool_plan) {
                  const initialTools: ToolTrace[] = data.tool_plan.map((item: any) => ({
                    tool: item.tool,
                    arguments: item.arguments,
                    status: "pending"
                  }));
                  setToolTraces(initialTools);
                }
              } else if (data.event === "tool_call_start") {
                setToolTraces((prev) =>
                  prev.map((t) =>
                    t.tool === data.tool ? { ...t, status: "running", arguments: data.arguments } : t
                  )
                );
              } else if (data.event === "tool_call_done") {
                setToolTraces((prev) =>
                  prev.map((t) =>
                    t.tool === data.tool
                      ? { ...t, status: "done", latency_ms: data.latency_ms, result: data.result }
                      : t
                  )
                );
              } else if (data.event === "token_chunk") {
                setStreamedText((prev) => prev + data.chunk);
              } else if (data.event === "stream_complete") {
                setIsLoading(false);
              }
            } catch (err) {
              console.error("Error parsing SSE JSON chunk:", err);
            }
          }
        }
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn("SSE stream interrupted, fallback to sync endpoint:", err);
      // Fallback to synchronous endpoint
      try {
        const fallbackRes = await fetch(`${backendUrl}/copilot/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryText })
        });
        const syncData = await fallbackRes.json();
        setActiveIntent(syncData.intent_label || syncData.intent);
        setToolTraces(
          (syncData.tool_traces || []).map((t: any) => ({
            tool: t.tool,
            arguments: t.arguments,
            result: t.result,
            latency_ms: t.latency_ms,
            status: t.status === "success" ? "done" : "error"
          }))
        );
        setStreamedText(syncData.response || "No response received.");
      } catch (syncErr: any) {
        setErrorMsg("Failed to connect to CarbonIQ backend at http://127.0.0.1:8000. Ensure uvicorn is running.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Copilot Header Card */}
      <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Scientific MRV Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  MCP Protocol Native
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Zero External LLM APIs
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Deterministic NLP Router • In-Process MCP Tool Engine • IPCC TF-IDF Knowledge Retrieval
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#060D0A]/70 px-3 py-1.5 rounded-lg border border-emerald-500/15">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>XGBoost + IsolationForest + GBR</span>
          </div>
        </div>

        {/* Quick-Prompt Chips */}
        <div className="mt-5 pt-4 border-t border-emerald-500/15">
          <div className="flex items-center gap-2 mb-2.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono text-slate-300 font-semibold tracking-wide uppercase">
              Quick Audit & Simulation Chips:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {DEFAULT_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleRunQuery(chip.prompt)}
                disabled={isLoading}
                className="group text-left p-3 rounded-lg bg-[#060D0A]/80 border border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-950/20 transition-all duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {chip.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80">
                    {chip.category === "telemetry_audit" && "Tamper Audit"}
                    {chip.category === "netzero_pathway" && "SBTi Pathway"}
                    {chip.category === "model_inference" && "XGBoost MRV"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                  "{chip.prompt}"
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuery(query);
          }}
          className="mt-4 flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask an IPCC accounting question or enter custom telemetry parameters..."
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg bg-[#060D0A] border border-emerald-500/30 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 font-sans disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Execution Results View */}
      {(toolTraces.length > 0 || streamedText) && (
        <div className="space-y-6">
          {/* Active Intent & Live MCP Tool Traces */}
          <div className="glass-card p-5 border-emerald-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Live MCP Tool Execution Pipeline
                </span>
                {activeIntent && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Intent: {activeIntent}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {toolTraces.filter((t) => t.status === "done").length} of {toolTraces.length} tools executed
              </div>
            </div>

            {/* Tool Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {toolTraces.map((trace, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-[#060D0A]/90 border border-emerald-500/20 p-3.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {trace.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : trace.status === "running" ? (
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="font-semibold text-slate-200">{trace.tool}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {trace.latency_ms !== undefined && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {trace.latency_ms} ms
                        </span>
                      )}
                      <button
                        onClick={() => toggleToolExpand(idx)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Inspect tool payload"
                      >
                        {expandedTools[idx] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Tool Summary */}
                  <div className="text-xs text-slate-400 font-mono">
                    {trace.tool === "get_live_sensor_telemetry" && trace.result && (
                      <span className="text-emerald-400">
                        Node: {trace.result.node_name} • Trust: {trace.result.trust_score}% • Stock: {trace.result.current_carbon_stock_tco2e_ha} tCO2e/ha
                      </span>
                    )}
                    {trace.tool === "simulate_net_zero_gap" && trace.result && (
                      <span className="text-cyan-400">
                        Target: {trace.result.target_year} • Bioreactors: {trace.result.assets_required?.microalgae_bioreactors_count} • Mangrove: {trace.result.assets_required?.blue_carbon_mangrove_ha} ha
                      </span>
                    )}
                    {trace.tool === "run_carbon_stock_inference" && trace.result && (
                      <span className="text-emerald-400">
                        Predicted Stock: {trace.result.carbon_stock_tco2e_ha} tCO2e/ha (R²: {trace.result.r2_score})
                      </span>
                    )}
                    {trace.tool === "check_sensor_anomaly" && trace.result && (
                      <span className={trace.result.is_anomaly ? "text-red-400" : "text-emerald-400"}>
                        Status: {trace.result.status} • Trust Score: {trace.result.trust_score}/100
                      </span>
                    )}
                    {trace.tool === "query_ipcc_guidelines" && trace.result && (
                      <span className="text-amber-300">
                        Retrieved {Array.isArray(trace.result) ? trace.result.length : 0} IPCC / Article 6 citations
                      </span>
                    )}
                  </div>

                  {/* Expanded JSON Inspector */}
                  <AnimatePresence>
                    {expandedTools[idx] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono overflow-x-auto"
                      >
                        <div className="mb-1 text-slate-500 uppercase tracking-wider text-[9px]">Input Parameters:</div>
                        <pre className="p-2 rounded bg-black/60 text-slate-300 mb-2">
                          {JSON.stringify(trace.arguments, null, 2)}
                        </pre>
                        <div className="mb-1 text-slate-500 uppercase tracking-wider text-[9px]">Tool Result:</div>
                        <pre className="p-2 rounded bg-black/60 text-emerald-400/90 max-h-40 overflow-y-auto">
                          {JSON.stringify(trace.result, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Formatted Scientific Output Report */}
          <div className="glass-card p-6 border-emerald-500/20 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Synthesized Scientific MRV Intelligence Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Article 6.2 ITMO Verified
                </span>
              </div>
            </div>

            {/* Markdown Report Render */}
            <div className="prose-carbon text-sm leading-relaxed text-slate-200">
              {streamedText.split("\n").map((line, lIdx) => {
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={lIdx} className="text-lg font-bold text-emerald-400 mt-4 mb-2 flex items-center gap-2">
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("#### ")) {
                  return (
                    <h4 key={lIdx} className="text-sm font-semibold text-cyan-400 mt-3 mb-1">
                      {line.replace("#### ", "")}
                    </h4>
                  );
                }
                if (line.startsWith("> ")) {
                  return (
                    <blockquote key={lIdx} className="border-l-2 border-emerald-400 pl-3 my-2 text-slate-300 italic bg-emerald-950/20 py-1 rounded-r">
                      {line.replace("> ", "")}
                    </blockquote>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <li key={lIdx} className="ml-4 list-disc text-slate-300 my-1">
                      {line.replace("- ", "")}
                    </li>
                  );
                }
                if (line.startsWith("|")) {
                  // Render table line simply or nicely
                  return (
                    <div key={lIdx} className="font-mono text-xs text-slate-300 py-0.5">
                      {line}
                    </div>
                  );
                }
                if (line.trim() === "") {
                  return <div key={lIdx} className="h-2" />;
                }
                return (
                  <p key={lIdx} className="my-1.5 text-slate-300">
                    {line}
                  </p>
                );
              })}

              {isLoading && (
                <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />
              )}
            </div>

            <div ref={responseEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
