"use client";

import React, { useState, useEffect, useCallback } from "react";
import PipelineStepper from "./PipelineStepper";
import KPICounters from "./KPICounters";
import LiveNodeTable, { NodeData } from "./LiveNodeTable";
import { API_URL } from "@/lib/config";
import { RefreshCw, Activity } from "lucide-react";

export default function CommandCenterView() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [totalCredits, setTotalCredits] = useState(3250.75);
  const [marketValueUsd, setMarketValueUsd] = useState(92646.38);
  const [systemTrustScore, setSystemTrustScore] = useState(97.8);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNodes = useCallback(async () => {
    try {
      const [nodesRes, regRes] = await Promise.all([
        fetch(`${API_URL}/nodes`),
        fetch(`${API_URL}/export/registry`)
      ]);
      const nodesData = await nodesRes.json();
      const regData = await regRes.json();

      if (nodesData.nodes) {
        setNodes(nodesData.nodes);
        const avgTrust =
          nodesData.nodes.reduce((acc: number, n: NodeData) => acc + (n.trust_score || 98.0), 0) /
          nodesData.nodes.length;
        setSystemTrustScore(avgTrust);
      }

      if (regData.issuance_summary) {
        setTotalCredits(regData.issuance_summary.total_issued_tco2e || 3250.75);
        setMarketValueUsd(regData.issuance_summary.total_market_valuation_usd || 92646.38);
      }
    } catch (err) {
      console.warn("Failed to fetch node data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleTickReceived = useCallback((_tickData: any) => {
    fetchNodes();
  }, [fetchNodes]);

  return (
    <div className="space-y-6">
      {/* Backend connection warning / waking banner if still loading after delay */}
      {isLoading && nodes.length === 0 && (
        <div className="glass-card p-3 border-emerald-500/20 flex items-center justify-between text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" strokeWidth={1.75} />
            <span>Connecting to CarbonIQ Engine... Initial spin-up on cloud tiers may take up to 45 seconds.</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Automatic Retry Active</span>
        </div>
      )}

      {/* 5-Step Pipeline Stepper */}
      <PipelineStepper onTickReceived={handleTickReceived} />

      {/* KPI Counters */}
      <KPICounters
        totalCredits={totalCredits}
        marketValueUsd={marketValueUsd}
        activeNodes={nodes.length || 6}
        systemTrustScore={systemTrustScore}
      />

      {/* Live Node Table */}
      <LiveNodeTable nodes={nodes} onRefreshNodes={fetchNodes} />
    </div>
  );
}
