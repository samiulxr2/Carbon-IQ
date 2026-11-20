"use client";

import React, { useState } from "react";
import { GeoNodeData } from "./BangladeshLeafletMap";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
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
        <MapPin className="w-8 h-8 text-emerald-400/50 mb-2" strokeWidth={1.75} />
        <p className="text-sm font-mono text-slate-300">Select a Station on the Map</p>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click any of Bangladesh&apos;s 6 monitoring stations to inspect live telemetry and run forensic validation.
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
      setActionMsg(`Tamper injected! Trust dropped to ${data.audit_result?.trust_score?.toFixed(1) || "21"}%. Ledger blocked.`);
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
      setActionMsg(`${data.message || "Node recalibrated successfully. Minting restored."}`);
      onRefresh();
    } catch {
      setActionMsg("Failed to reset node calibration.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="glass-card p-4 border-emerald-500/20 flex flex-col justify-between h-[380px] sm:h-[480px] lg:h-[520px] overflow-y-auto">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                {node.id}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                {node.node_type === "chamber" ? "Closed Chamber" : "Field Wetland"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mt-1 leading-snug">{node.name}</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {node.lat.toFixed(4)}°N, {node.lon.toFixed(4)}°E &bull; {node.area_ha} ha
            </p>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded ${
                isTampered
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isTampered ? (
                <>
                  <ShieldAlert className="w-3 h-3 text-red-400" strokeWidth={1.75} />
                  <span>Fraud Alert</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                  <span>Verified</span>
                </>
              )}
            </span>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Trust: <span className={isTampered ? "text-red-400 font-semibold" : "text-cyan-400 font-semibold"}>{node.trust_score.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Action feedback message */}
        {actionMsg && (
          <div className={`p-2 rounded-[6px] text-[11px] font-mono leading-tight ${
            isTampered ? "bg-red-500/15 text-red-300 border border-red-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }`}>
            {actionMsg}
          </div>
        )}

        {/* Carbon Stock KPI Block */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800 font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Current AI Stock</div>
            <div className="text-base font-semibold text-emerald-400 flex items-baseline gap-1">
              {node.current_carbon_stock?.toFixed(1) || "0.0"}
              <span className="text-[10px] text-slate-400 font-normal">tCO2e/ha</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Baseline Target</div>
            <div className="text-base font-semibold text-slate-300 flex items-baseline gap-1">
              {node.baseline_tco2e?.toFixed(1) || "0.0"}
              <span className="text-[10px] text-slate-500 font-normal">tCO2e/ha</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Sensor Grid */}
        <div>
          <div className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
              <span>Edge Telemetry Snapshot</span>
            </span>
            <span className="text-[9px] text-slate-500">Live 15-min</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {node.node_type !== "chamber" ? (
              <>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" strokeWidth={1.75} /> Soil Moisture
                  </span>
                  <span className="text-white font-semibold">{tele.soil_moisture?.toFixed(1) ?? "48.2"}%</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-400" strokeWidth={1.75} /> Soil Temp
                  </span>
                  <span className="text-white font-semibold">{tele.soil_temp?.toFixed(1) ?? "31.4"}°C</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Sun className="w-3 h-3 text-emerald-400" strokeWidth={1.75} /> NDVI Proxy
                  </span>
                  <span className="text-emerald-400 font-semibold">{tele.ndvi_satellite?.toFixed(3) ?? "0.820"}</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" strokeWidth={1.75} /> NDWI Water
                  </span>
                  <span className="text-cyan-400 font-semibold">{tele.ndwi_satellite?.toFixed(3) ?? "0.380"}</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between col-span-2">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" strokeWidth={1.75} /> Salinity / Biomass
                  </span>
                  <span className="text-white font-semibold">
                    {tele.salinity_ec?.toFixed(1) ?? "12.4"} dS/m &bull; {tele.biomass_proxy?.toFixed(0) ?? "175"} g/m²
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" strokeWidth={1.75} /> CO2 Dissolved
                  </span>
                  <span className="text-white font-semibold">{tele.co2_ppm?.toFixed(0) ?? "1,340"} ppm</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-emerald-400" strokeWidth={1.75} /> Turbidity
                  </span>
                  <span className="text-emerald-400 font-semibold">{tele.turbidity_ntu?.toFixed(0) ?? "148"} NTU</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" strokeWidth={1.75} /> O2 Output
                  </span>
                  <span className="text-white font-semibold">{tele.o2_percent?.toFixed(1) ?? "22.1"}%</span>
                </div>
                <div className="p-2 rounded-[6px] bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-cyan-400" strokeWidth={1.75} /> Culture Temp
                  </span>
                  <span className="text-cyan-400 font-semibold">{tele.water_temp?.toFixed(1) ?? "24.6"}°C</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSimulateTamper}
            disabled={isTampering}
            className="btn-danger text-center justify-center flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{isTampering ? "Injecting..." : "Inject Spoof"}</span>
          </button>

          <button
            onClick={handleRecalibrate}
            disabled={isResetting}
            className="btn-primary text-center justify-center flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{isResetting ? "Resetting..." : "Recalibrate"}</span>
          </button>
        </div>

        {onForecastNodeSelect && (
          <button
            onClick={() => onForecastNodeSelect(node.id)}
            className="btn-secondary w-full text-center justify-center flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Sync Forecast Charts for {node.id}</span>
          </button>
        )}
      </div>
    </div>
  );
}
