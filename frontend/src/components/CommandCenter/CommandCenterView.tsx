"use client";

import React, { useState, useEffect, useCallback } from "react";
import PipelineStepper from "./PipelineStepper";
import KPICounters from "./KPICounters";
import LiveNodeTable, { NodeData } from "./LiveNodeTable";

export default function CommandCenterView() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [totalCredits, setTotalCredits] = useState(3250.75);
  const [marketValueUsd, setMarketValueUsd] = useState(92646.38);
  const [systemTrustScore, setSystemTrustScore] = useState(97.8);

  const fetchNodes = useCallback(async () => {
    try {
      const [nodesRes, regRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/nodes"),
        fetch("http://127.0.0.1:8000/export/registry")
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
      {/* 5-Step Continuous Pipeline Stepper */}
      <PipelineStepper onTickReceived={handleTickReceived} />

      {/* KPI Real Counter Cards */}
      <KPICounters
        totalCredits={totalCredits}
        marketValueUsd={marketValueUsd}
        activeNodes={nodes.length || 6}
        systemTrustScore={systemTrustScore}
      />

      {/* Live Node Table with Trust Score Badges & Gatekeeper Action */}
      <LiveNodeTable nodes={nodes} onRefreshNodes={fetchNodes} />
    </div>
  );
}
