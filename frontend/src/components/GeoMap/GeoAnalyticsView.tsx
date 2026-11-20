"use client";

import React, { useState, useEffect, useCallback } from "react";
import GeoMapWrapper from "./GeoMapWrapper";
import NodeTelemetrySidePanel from "./NodeTelemetrySidePanel";
import CalibrationChart from "../Analytics/CalibrationChart";
import ForecastChart from "../Analytics/ForecastChart";
import { GeoNodeData } from "./BangladeshLeafletMap";
import { Map, Layers, Radio } from "lucide-react";
import { API_URL } from "@/lib/config";

export default function GeoAnalyticsView() {
  const [nodes, setNodes] = useState<GeoNodeData[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("NODE-BD-01");
  const [, setLoading] = useState<boolean>(true);

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/nodes`);
      if (res.ok) {
        const data = await res.json();
        const mapped: GeoNodeData[] = (data.nodes || []).map((n: any) => ({
          id: n.id,
          name: n.name,
          node_type: n.node_type,
          ecosystem: n.ecosystem,
          lat: n.latitude,
          lon: n.longitude,
          area_ha: n.area_ha,
          baseline_tco2e: n.baseline_tco2e,
          current_carbon_stock: n.latest_telemetry?.carbon_stock ?? n.baseline_tco2e,
          trust_score: n.latest_telemetry?.trust_score ?? 98.0,
          status: n.status,
          latest_telemetry: n.latest_telemetry
        }));
        setNodes(mapped);
      }
    } catch {
      console.error("Failed to fetch registered nodes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(async () => {
      try {
        const liveRes = await fetch(`${API_URL}/telemetry/live`);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          const ticks = liveData.streaming_ticks || [];
          setNodes((prev) =>
            prev.map((node) => {
              const tick = ticks.find((t: any) => t.node_id === node.id);
              if (tick) {
                return {
                  ...node,
                  current_carbon_stock: tick.carbon_stock_tco2e_ha,
                  trust_score: tick.trust_score,
                  status: tick.status,
                  latest_telemetry: {
                    ...tick.telemetry,
                    carbon_stock: tick.carbon_stock_tco2e_ha,
                    trust_score: tick.trust_score
                  }
                };
              }
              return node;
            })
          );
        }
      } catch {
        // Polling retry
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-4 border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Map className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              <span>Spatial Monitoring &amp; Analytics</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                GIS Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              OpenStreetMap telemetry stations &bull; Select any station to inspect live biophysical metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#060D0A] border border-slate-800">
            <Radio className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
            <span className="text-slate-400">Sync:</span>
            <span className="text-emerald-400 font-medium">5s Stream</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#060D0A] border border-slate-800">
            <Layers className="w-3 h-3 text-cyan-400" strokeWidth={1.75} />
            <span className="text-slate-400">Stations:</span>
            <span className="text-cyan-400 font-medium">{nodes.length} Nodes</span>
          </div>
        </div>
      </div>

      {/* Top Grid: Leaflet Map (2 cols on lg) + Telemetry Side Panel (1 col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GeoMapWrapper
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
          />
        </div>

        <div className="lg:col-span-1">
          <NodeTelemetrySidePanel
            node={selectedNode}
            backendUrl={API_URL}
            onRefresh={fetchNodes}
            onForecastNodeSelect={(id) => setSelectedNodeId(id)}
          />
        </div>
      </div>

      {/* Bottom Section: Recharts Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalibrationChart
          nodeId={selectedNodeId}
          nodeName={selectedNode?.name}
          backendUrl={API_URL}
        />

        <ForecastChart
          nodeId={selectedNodeId}
          nodeName={selectedNode?.name}
          backendUrl={API_URL}
        />
      </div>
    </div>
  );
}
