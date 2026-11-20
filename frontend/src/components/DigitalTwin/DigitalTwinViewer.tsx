"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Trees,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  RefreshCw,
  Sun,
  Waves,
  Zap,
  Thermometer,
  Wind,
  RotateCcw
} from "lucide-react";
import { API_URL } from "@/lib/config";

// Lazy-load Three.js Canvas to prevent Next.js SSR hydration mismatches
const DigitalTwinCanvas = dynamic(
  () => import("./DigitalTwinCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] sm:h-[420px] rounded-[8px] bg-[#0A1410] border border-emerald-500/20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" strokeWidth={1.75} />
        <span className="text-xs font-mono text-slate-400">Loading 3D Digital Twin Simulation Engine...</span>
      </div>
    )
  }
);

interface TamperLog {
  id: string;
  timestamp: string;
  nodeId: string;
  tamperType: string;
  trustScore: number;
  reason: string;
}

export default function DigitalTwinViewer() {
  const [sceneType, setSceneType] = useState<"field" | "bioreactor">("field");
  const [selectedSensor, setSelectedSensor] = useState<string>("telemetry_tower");
  const [isTampered, setIsTampered] = useState(false);
  const [isTamperingAction, setIsTamperingAction] = useState(false);
  const [tamperLogs, setTamperLogs] = useState<TamperLog[]>([]);

  // Field Hardware Sliders
  const [tidalLevel, setTidalLevel] = useState(0.65);
  const [solarIntensity, setSolarIntensity] = useState(0.75);

  // Bio-Reactor Hardware Sliders
  const [ledIntensity, setLedIntensity] = useState(0.85);
  const [coolingTemp, setCoolingTemp] = useState(25.5);
  const [pumpSpeed, setPumpSpeed] = useState(0.60);

  // Active node ID based on scene
  const activeNodeId = sceneType === "field" ? "NODE-BD-01" : "NODE-BD-06";

  // Check initial tamper status from backend
  useEffect(() => {
    const checkNodeStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/nodes`);
        const data = await res.json();
        const activeNode = data.nodes?.find((n: any) => n.id === activeNodeId);
        if (activeNode) {
          setIsTampered(activeNode.status === "tampered" || activeNode.trust_score < 80.0);
        }
      } catch {
        // Backend fallback
      }
    };
    checkNodeStatus();
  }, [activeNodeId]);

  // Derived telemetry calculations affected by hardware sliders
  const derivedFieldMetrics = {
    soilMoisture: (60.0 + tidalLevel * 30.0).toFixed(1),
    salinityEc: (12.0 + tidalLevel * 12.0).toFixed(1),
    soilTemp: (24.0 + solarIntensity * 10.0).toFixed(1),
    ndvi: (0.62 + solarIntensity * 0.22).toFixed(3),
    carbonStock: (170.0 + tidalLevel * 35.0 + solarIntensity * 25.0).toFixed(1),
    trustScore: isTampered ? 22.1 : 97.4
  };

  const derivedBioreactorMetrics = {
    co2Ppm: Math.round(2600.0 - ledIntensity * 1300.0),
    o2Percent: (20.2 + ledIntensity * 3.4).toFixed(1),
    turbidityNtu: Math.round(110.0 + ledIntensity * 140.0 + (pumpSpeed * 40.0)),
    waterTemp: coolingTemp.toFixed(1),
    carbonStock: (260.0 + ledIntensity * 55.0 - Math.abs(coolingTemp - 26.0) * 4.0).toFixed(1),
    trustScore: isTampered ? 26.0 : 98.3
  };

  // Trigger tampering via backend
  const handleSimulateTamper = async () => {
    setIsTamperingAction(true);
    try {
      const tamperType = sceneType === "field" ? "spoof_ndvi" : "co2_spike";
      const res = await fetch(`${API_URL}/simulate/tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: activeNodeId,
          tamper_type: tamperType
        })
      });
      const data = await res.json();
      setIsTampered(true);

      const newLog: TamperLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        nodeId: activeNodeId,
        tamperType: tamperType === "spoof_ndvi" ? "Spoofed NDVI/NDWI Injected" : "Chamber CO2 Bias Spike",
        trustScore: data.audit_result?.trust_score?.toFixed(1) || 24.5,
        reason: "IsolationForest Multi-Variance Residual Drift (> 4.2σ)"
      };
      setTamperLogs((prev) => [newLog, ...prev]);
    } catch {
      setIsTampered(true);
    } finally {
      setIsTamperingAction(false);
    }
  };

  // Restore & recalibrate node
  const handleRecalibrate = async () => {
    setIsTamperingAction(true);
    try {
      await fetch(`${API_URL}/simulate/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: activeNodeId })
      });
      setIsTampered(false);
      setTamperLogs((prev) => [
        {
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toLocaleTimeString(),
          nodeId: activeNodeId,
          tamperType: "Node Recalibrated & Restored",
          trustScore: 98.2,
          reason: "Zero Residual Drift; Hash-chain minting unblocked"
        },
        ...prev
      ]);
    } catch {
      setIsTampered(false);
    } finally {
      setIsTamperingAction(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Scene Selector Controls */}
      <div className="glass-card p-5 border-emerald-500/20 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trees className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-white">
                  3D Digital Twin Simulation
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Three.js + WebGL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardware Sensor Actuation &bull; Real-Time Biophysical 3D Rendering &bull; Fraud Simulation
              </p>
            </div>
          </div>

          {/* Scene Selector Toggle Buttons */}
          <div className="flex items-center p-0.5 rounded-[6px] bg-[#060D0A] border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                setSceneType("field");
                setSelectedSensor("telemetry_tower");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
                sceneType === "field"
                  ? "bg-emerald-500 text-black font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trees className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Field Twin (Sundarbans)</span>
            </button>
            <button
              onClick={() => {
                setSceneType("bioreactor");
                setSelectedSensor("chamber_beacon");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
                sceneType === "bioreactor"
                  ? "bg-cyan-500 text-black font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Bio-Reactor Twin (Dhaka)</span>
            </button>
          </div>
        </div>

        {/* Tamper Alert Banner */}
        {isTampered && (
          <div className="mt-4 p-3 rounded-[6px] bg-red-950/40 border border-red-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-red-200">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.75} />
              <div>
                <span className="font-semibold text-red-400 uppercase tracking-wide">
                  LEDGER GATEKEEPER ALERT: SENSOR FRAUD DETECTED ON {activeNodeId}
                </span>
                <p className="text-red-300/80 text-[11px] font-mono mt-0.5">
                  Beacon pulsing RED. Trust Score fell below 95.0% threshold. Article 6.2 SHA-256 minting is BLOCKED.
                </p>
              </div>
            </div>
            <button
              onClick={handleRecalibrate}
              disabled={isTamperingAction}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Recalibrate &amp; Restore</span>
            </button>
          </div>
        )}
      </div>

      {/* Main 3D Canvas & Side Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3D Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <DigitalTwinCanvas
            sceneType={sceneType}
            isTampered={isTampered}
            selectedSensor={selectedSensor}
            onSelectSensor={setSelectedSensor}
            tidalLevel={tidalLevel}
            solarIntensity={solarIntensity}
            ledIntensity={ledIntensity}
            coolingTemp={coolingTemp}
            pumpSpeed={pumpSpeed}
          />

          {/* Interactive Hardware Controls Bar */}
          <div className="glass-card p-4 border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wide">
                  {sceneType === "field" ? "Environmental Control Knobs" : "Photobioreactor Actuators"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Directly modulates 3D physics &amp; live telemetry
              </span>
            </div>

            {sceneType === "field" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                      Tidal Inundation Depth:
                    </span>
                    <span className="text-cyan-400 font-semibold">{Math.round(tidalLevel * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={tidalLevel}
                    onChange={(e) => setTidalLevel(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Low Tide (12 dS/m)</span>
                    <span>Spring High Tide (24 dS/m)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                      Solar Irradiation Index:
                    </span>
                    <span className="text-amber-400 font-semibold">{Math.round(solarIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={solarIntensity}
                    onChange={(e) => setSolarIntensity(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Overcast (24°C)</span>
                    <span>Peak Solar (35°C)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-fuchsia-400" strokeWidth={1.75} />
                      LED Grow Lights:
                    </span>
                    <span className="text-fuchsia-400 font-semibold">{Math.round(ledIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ledIntensity}
                    onChange={(e) => setLedIntensity(parseFloat(e.target.value))}
                    className="w-full accent-fuchsia-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Dark</span>
                    <span>Saturation</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                      Cooling Unit Temp:
                    </span>
                    <span className="text-cyan-400 font-semibold">{coolingTemp.toFixed(1)}°C</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="34"
                    step="0.5"
                    value={coolingTemp}
                    onChange={(e) => setCoolingTemp(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>18°C (Chill)</span>
                    <span>26°C (Optimal)</span>
                    <span>34°C (Stress)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
                      Bubble Pump:
                    </span>
                    <span className="text-emerald-400 font-semibold">{Math.round(pumpSpeed * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={pumpSpeed}
                    onChange={(e) => setPumpSpeed(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Laminar</span>
                    <span>Turbulent</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Telemetry Inspector & Tamper Playground */}
        <div className="space-y-4">
          {/* Live Node Status Card */}
          <div className="glass-card p-5 border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Active Station
                </span>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {sceneType === "field" ? "Sundarbans Wetland" : "Dhaka Photobioreactor"}
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  {activeNodeId} &bull; {sceneType === "field" ? "125 Hectares" : "Modular 5 ha Array"}
                </span>
              </div>

              <div
                className={`px-2 py-0.5 rounded-[4px] text-xs font-mono font-semibold uppercase border ${
                  isTampered
                    ? "bg-red-950/80 border-red-500 text-red-400"
                    : "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
                }`}
              >
                {isTampered ? "TAMPERED" : "VERIFIED"}
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Carbon Stock</span>
                <span className="text-base font-semibold text-emerald-400">
                  {sceneType === "field" ? derivedFieldMetrics.carbonStock : derivedBioreactorMetrics.carbonStock}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">t/ha</span>
              </div>

              <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Trust Score</span>
                <span
                  className={`text-base font-semibold ${
                    isTampered ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {isTampered
                    ? (sceneType === "field" ? "22.1" : "26.0")
                    : (sceneType === "field" ? derivedFieldMetrics.trustScore : derivedBioreactorMetrics.trustScore)}
                  /100
                </span>
              </div>

              {sceneType === "field" ? (
                <>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Soil Moisture</span>
                    <span className="text-slate-200 font-medium">{derivedFieldMetrics.soilMoisture}%</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Salinity EC</span>
                    <span className="text-slate-200 font-medium">{derivedFieldMetrics.salinityEc} dS/m</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Soil Temp</span>
                    <span className="text-slate-200 font-medium">{derivedFieldMetrics.soilTemp}°C</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">NDVI Proxy</span>
                    <span className="text-cyan-400 font-medium">{derivedFieldMetrics.ndvi}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">CO2 Dissolved</span>
                    <span className="text-slate-200 font-medium">{derivedBioreactorMetrics.co2Ppm} ppm</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">O2 Evolution</span>
                    <span className="text-emerald-400 font-medium">{derivedBioreactorMetrics.o2Percent}%</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Turbidity</span>
                    <span className="text-slate-200 font-medium">{derivedBioreactorMetrics.turbidityNtu} NTU</span>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Water Temp</span>
                    <span className="text-cyan-400 font-medium">{derivedBioreactorMetrics.waterTemp}°C</span>
                  </div>
                </>
              )}
            </div>

            {/* Selected 3D Sub-Component Tag */}
            <div className="p-2 rounded-[6px] bg-black/40 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-300">
              <span className="text-slate-500 uppercase">Selected 3D Mesh:</span>
              <span className="text-emerald-400 font-medium">{selectedSensor.replace("_", " ").toUpperCase()}</span>
            </div>

            {/* Tamper Simulation Action Button */}
            <div className="pt-1">
              <button
                onClick={handleSimulateTamper}
                disabled={isTamperingAction || isTampered}
                className="btn-danger w-full py-2 px-3 text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Simulate Sensor Tampering</span>
              </button>
            </div>
          </div>

          {/* Tamper Audit Log Panel */}
          <div className="glass-card p-4 border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                <span>Audit Trail</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live Quarantine Log</span>
            </div>

            {tamperLogs.length === 0 ? (
              <div className="p-3 rounded-[6px] bg-[#060D0A] border border-slate-800 text-xs font-mono text-slate-500 text-center">
                Zero active tamper incidents. All stations operating within verified parameters.
              </div>
            ) : (
              <div className="space-y-2">
                {tamperLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-[6px] bg-red-950/30 border border-red-500/30 text-[11px] font-mono text-red-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-red-400">{log.nodeId} Alert</span>
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[10px] mb-1">{log.tamperType}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-red-400">Trust: {log.trustScore}%</span>
                      <span className="text-amber-400 font-medium">Minting Aborted</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
