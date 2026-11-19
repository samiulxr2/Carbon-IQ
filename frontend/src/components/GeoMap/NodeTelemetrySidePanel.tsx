"use client";

import React, { useState } from "react";
import { GeoNodeData } from "./BangladeshLeafletMap";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Zap,
  Radio,
  MapPin,
  TrendingUp,
  Droplets,
  Thermometer,
  Sun,
  Layers,
  FlaskConical
} from "lucide-react";

interface NodeTelemetrySidePanelProps {
  node?: GeoNodeData;
  backendUrl: string;
  onRefresh: () => void;
  onForecastNodeSelect?: (nodeId: string) => void;
}

export default function NodeTelemetrySidePanel({
  node,
  backendUrl,
  onRefresh,
  onForecastNodeSelect
}: NodeTelemetrySidePanelProps) {
  const [isTampering, setIsTampering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  if (!node) {
    return (
      <div className="h-full glass-card p-5 border-emerald-500/20 flex flex-col items-center justify-center text-center text-slate-400">
        <MapPin className="w-8 h-8 text-emerald-400/50 mb-2 animate-bounce" />
        <p className="text-sm font-mono text-slate-300">Select a Monitoring Pin on the Map</p>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click any of Bangladesh&apos;s 6 geo-tagged stations to inspect live telemetry and run forensic validation.
        </p>
      </div>
    );
  }

  const isTampered = node.trust_score < 95 || node.status === "TAMPERED" || node.status === "anomaly";
  const tele = node.latest_telemetry || {};

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${backendUrl}/simulate/tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: node.id,
          tamper_type: node.node_type === "chamber" ? "co2_spike" : "spoof_ndvi"
        })
      });
      const data = await res.json();
      setActionMsg(`⚠️ Tamper injected! Trust dropped to ${data.audit_result?.trust_score?.toFixed(1) || "21"}%. Ledger blocked.`);
      onRefresh();
    } catch {
      setActionMsg("Failed to simulate tampering. Check backend connectivity.");
    } finally {
      setIsTampering(false);
    }
  };

  const handleRecalibrate = async () => {
    setIsResetting(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${backendUrl}/simulate/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: node.id })
      });
      const data = await res.json();
      setActionMsg(`✅ ${data.message || "Node recalibrated successfully. Minting restored."}`);
      onRefresh();
    } catch {
      setActionMsg("Failed to reset node calibration.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="glass-card p-4 border-emerald-500/20 flex flex-col justify-between h-[520px] overflow-y-auto">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 border-b border-emerald-500/15 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {node.id}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                {node.node_type === "chamber" ? "Closed Chamber" : "Field Wetland"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1 leading-snug">{node.name}</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {node.lat.toFixed(4)}°N, {node.lon.toFixed(4)}°E • {node.area_ha} ha
            </p>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded ${
                isTampered
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isTampered ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span>Fraud Alert</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified</span>
                </>
              )}
            </span>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Trust: <span className={isTampered ? "text-red-400 font-bold" : "text-cyan-400 font-bold"}>{node.trust_score.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Action feedback message */}
        {actionMsg && (
          <div className={`p-2 rounded text-[11px] font-mono leading-tight ${
            isTampered ? "bg-red-500/15 text-red-300 border border-red-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }`}>
            {actionMsg}
          </div>
        )}

        {/* Carbon Stock KPI Block */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#060D0A] border border-emerald-500/15 font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Current AI Stock</div>
            <div className="text-lg font-bold text-emerald-400 flex items-baseline gap-1">
              {node.current_carbon_stock?.toFixed(1) || "0.0"}
              <span className="text-[10px] text-slate-400 font-normal">tCO2e/ha</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Baseline Target</div>
            <div className="text-lg font-bold text-slate-300 flex items-baseline gap-1">
              {node.baseline_tco2e?.toFixed(1) || "0.0"}
              <span className="text-[10px] text-slate-500 font-normal">tCO2e/ha</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Sensor Grid */}
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Edge Telemetry Snapshot</span>
            </span>
            <span className="text-[9px] text-slate-500">Live 15-min</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {node.node_type !== "chamber" ? (
              <>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" /> Soil Moisture
                  </span>
                  <span className="text-white font-bold">{tele.soil_moisture?.toFixed(1) ?? "48.2"}%</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-400" /> Soil Temp
                  </span>
                  <span className="text-white font-bold">{tele.soil_temp?.toFixed(1) ?? "31.4"}°C</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Sun className="w-3 h-3 text-emerald-400" /> NDVI Proxy
                  </span>
                  <span className="text-emerald-400 font-bold">{tele.ndvi_satellite?.toFixed(3) ?? "0.820"}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" /> NDWI Water
                  </span>
                  <span className="text-cyan-400 font-bold">{tele.ndwi_satellite?.toFixed(3) ?? "0.380"}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between col-span-2">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" /> Salinity EC / Biomass
                  </span>
                  <span className="text-white font-bold">
                    {tele.salinity_ec?.toFixed(1) ?? "12.4"} dS/m • {tele.biomass_proxy?.toFixed(0) ?? "175"} g/m²
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> CO2 Dissolved
                  </span>
                  <span className="text-white font-bold">{tele.co2_ppm?.toFixed(0) ?? "1,340"} ppm</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-emerald-400" /> Optical Turbidity
                  </span>
                  <span className="text-emerald-400 font-bold">{tele.turbidity_ntu?.toFixed(0) ?? "148"} NTU</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" /> O2 Output
                  </span>
                  <span className="text-white font-bold">{tele.o2_percent?.toFixed(1) ?? "22.1"}%</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-cyan-400" /> Culture Temp
                  </span>
                  <span className="text-cyan-400 font-bold">{tele.water_temp?.toFixed(1) ?? "24.6"}°C</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-3 border-t border-emerald-500/15">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulateTamper}
            disabled={isTampering}
            className="py-2 px-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3 h-3" />
            <span>{isTampering ? "Injecting..." : "Inject Spoof"}</span>
          </button>

          <button
            onClick={handleRecalibrate}
            disabled={isResetting}
            className="py-2 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isResetting ? "Resetting..." : "Recalibrate"}</span>
          </button>
        </div>

        {onForecastNodeSelect && (
          <button
            onClick={() => onForecastNodeSelect(node.id)}
            className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Sync Calibration & Forecast Charts for {node.id}</span>
          </button>
        )}
      </div>
    </div>
  );
}
