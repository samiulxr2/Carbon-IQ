"use client";

import React, { useState } from "react";
import {
  Trees,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { API_URL } from "@/lib/config";

export interface NodeData {
  id: string;
  name: string;
  node_type: string;
  ecosystem: string;
  latitude: number;
  longitude: number;
  area_ha: number;
  baseline_tco2e: number;
  status: string;
  current_carbon_stock: number;
  trust_score: number;
  last_updated: string;
  total_anomalies_detected: number;
  latest_reading?: any;
}

interface LiveNodeTableProps {
  nodes: NodeData[];
  onRefreshNodes?: () => void;
}

export default function LiveNodeTable({ nodes, onRefreshNodes }: LiveNodeTableProps) {
  const [loadingActionNode, setLoadingActionNode] = useState<string | null>(null);

  const handleTamper = async (nodeId: string, nodeType: string) => {
    setLoadingActionNode(nodeId);
    try {
      const tamperType = nodeType === "field" ? "spoof_ndvi" : "co2_spike";
      await fetch(`${API_URL}/simulate/tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: nodeId, tamper_type: tamperType })
      });
      if (onRefreshNodes) onRefreshNodes();
    } catch (err) {
      console.error("Tamper trigger failed:", err);
    } finally {
      setLoadingActionNode(null);
    }
  };

  const handleReset = async (nodeId: string) => {
    setLoadingActionNode(nodeId);
    try {
      await fetch(`${API_URL}/simulate/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: nodeId })
      });
      if (onRefreshNodes) onRefreshNodes();
    } catch (err) {
      console.error("Reset trigger failed:", err);
    } finally {
      setLoadingActionNode(null);
    }
  };

  return (
    <div className="glass-card p-6 border-emerald-500/20 space-y-4">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
            Registered Monitoring Geo-Nodes ({nodes.length})
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Click any action button to test real-time fraud guard & ledger gatekeeper
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-emerald-500/20 text-slate-400 uppercase text-[10px] tracking-wider bg-[#060D0A]/60">
              <th className="py-3 px-3">Node ID & Ecosystem</th>
              <th className="py-3 px-3">Coordinates & Area</th>
              <th className="py-3 px-3">Carbon Stock (tCO2e/ha)</th>
              <th className="py-3 px-3">Telemetry Snapshot</th>
              <th className="py-3 px-3">Trust Score / Audit</th>
              <th className="py-3 px-3 text-right">Gatekeeper Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {nodes.map((node) => {
              const isTampered = node.status === "tampered" || node.trust_score < 90.0;
              const r = node.latest_reading || {};

              return (
                <tr
                  key={node.id}
                  className={`hover:bg-emerald-950/20 transition-colors ${
                    isTampered ? "bg-red-950/20" : ""
                  }`}
                >
                  {/* Node ID & Ecosystem */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          node.node_type === "field"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        }`}
                      >
                        {node.node_type === "field" ? (
                          <Trees className="w-3.5 h-3.5" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white tracking-wide">{node.id}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{node.name}</div>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {node.ecosystem.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Coordinates & Area */}
                  <td className="py-3.5 px-3 text-slate-300">
                    <div>{node.latitude.toFixed(4)}° N, {node.longitude.toFixed(4)}° E</div>
                    <div className="text-slate-500 text-[10px]">{node.area_ha} Hectares</div>
                    <div className="text-emerald-400/80 text-[10px]">Baseline: {node.baseline_tco2e} t</div>
                  </td>

                  {/* Carbon Stock */}
                  <td className="py-3.5 px-3 font-semibold text-sm">
                    <span className="text-emerald-400">{node.current_carbon_stock?.toFixed(2)}</span>
                    <span className="text-slate-500 text-[10px] ml-1">tCO2e/ha</span>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Pool: {((node.current_carbon_stock || 0) * node.area_ha).toLocaleString(undefined, { maximumFractionDigits: 0 })} t
                    </div>
                  </td>

                  {/* Telemetry Snapshot */}
                  <td className="py-3.5 px-3 text-[11px] text-slate-300">
                    {node.node_type === "field" ? (
                      <div className="space-y-0.5">
                        <div>
                          Moisture: <span className="text-cyan-400">{r.soil_moisture ?? "78.2"}%</span> | EC: <span className="text-slate-200">{r.salinity_ec ?? "18.5"} dS/m</span>
                        </div>
                        <div>
                          Temp: <span className="text-amber-400">{r.soil_temp ?? "28.0"}°C</span> | NDVI: <span className="text-emerald-400">{r.ndvi_satellite ?? "0.778"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div>
                          CO2: <span className="text-cyan-400">{r.co2_ppm ?? "1780.0"} ppm</span> | Temp: <span className="text-amber-400">{r.water_temp ?? "25.2"}°C</span>
                        </div>
                        <div>
                          Turbidity: <span className="text-emerald-400">{r.turbidity_ntu ?? "188.0"} NTU</span>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Trust Score & Verification Badge */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold ${
                          isTampered ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {node.trust_score?.toFixed(1)}%
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border ${
                          isTampered
                            ? "bg-red-950/80 border-red-500 text-red-300 animate-pulse"
                            : "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                        }`}
                      >
                        {isTampered ? "TAMPERED" : "VERIFIED"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isTampered ? "Ledger Minting Halted" : "Minted to Hash Chain"}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    {isTampered ? (
                      <button
                        onClick={() => handleReset(node.id)}
                        disabled={loadingActionNode === node.id}
                        className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] font-mono flex items-center gap-1 ml-auto transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Recalibrate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTamper(node.id, node.node_type)}
                        disabled={loadingActionNode === node.id}
                        className="px-2.5 py-1 rounded bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-400 font-semibold text-[10px] font-mono flex items-center gap-1 ml-auto transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Spoof Sensor</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
