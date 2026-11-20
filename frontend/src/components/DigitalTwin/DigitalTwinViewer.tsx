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
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Activity,
  Layers
} from "lucide-react";
import { API_URL } from "@/lib/config";

// Lazy-load Three.js Canvas to prevent Next.js SSR hydration mismatches
const DigitalTwinCanvas = dynamic(
  () => import("./DigitalTwinCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-xl bg-[#0A1410] border border-emerald-500/20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
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
      } catch (err) {
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

  // Trigger simulate tampering
  const handleSimulateTamper = async () => {
    setIsTamperingAction(true);
    const tamperType = sceneType === "field" ? "spoof_ndvi" : "co2_spike";

    try {
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
        tamperType: data.tamper_description || tamperType,
        trustScore: data.audit_results?.trust_score || 22.1,
        reason: data.ledger_gatekeeper?.rejection_reason || "Trust score below 95% threshold. Ledger minting halted."
      };
      setTamperLogs((prev) => [newLog, ...prev.slice(0, 4)]);
    } catch (err) {
      console.error("Tamper simulation failed:", err);
      setIsTampered(true);
    } finally {
      setIsTamperingAction(false);
    }
  };

  // Recalibrate / Reset Node
  const handleRecalibrate = async () => {
    setIsTamperingAction(true);
    try {
      await fetch(`${API_URL}/simulate/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: activeNodeId })
      });
      setIsTampered(false);
    } catch (err) {
      console.error("Recalibrate failed:", err);
      setIsTampered(false);
    } finally {
      setIsTamperingAction(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Digital Twin Header Card */}
      <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  3D MRV Digital Twin
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Interactive R3F Scene
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  {">"} 60 FPS Optimized
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-Time Physical Simulation • Bi-Directional Telemetry Feedback • Fraud Attack Simulator
              </p>
            </div>
          </div>

          {/* Scene Switcher Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-[#060D0A] border border-emerald-500/20 text-xs font-mono">
            <button
              onClick={() => {
                setSceneType("field");
                setSelectedSensor("telemetry_tower");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                sceneType === "field"
                  ? "bg-emerald-500 text-black font-semibold shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>Field Twin (Sundarbans)</span>
            </button>
            <button
              onClick={() => {
                setSceneType("bioreactor");
                setSelectedSensor("chamber_beacon");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                sceneType === "bioreactor"
                  ? "bg-cyan-500 text-black font-semibold shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Bio-Reactor Twin (Dhaka)</span>
            </button>
          </div>
        </div>

        {/* Tamper Alert Banner */}
        {isTampered && (
          <div className="mt-4 p-3.5 rounded-lg bg-red-950/60 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5 text-xs text-red-200">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-bold text-red-400 uppercase tracking-wide">
                  ⚠️ LEDGER GATEKEEPER ALERT: SENSOR FRAUD DETECTED ON {activeNodeId}
                </span>
                <p className="text-red-300/80 text-[11px] font-mono mt-0.5">
                  Beacon pulsing RED. Trust Score fell below 95.0% threshold. Article 6.2 SHA-256 minting is BLOCKED.
                </p>
              </div>
            </div>
            <button
              onClick={handleRecalibrate}
              disabled={isTamperingAction}
              className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold font-mono flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recalibrate & Restore</span>
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
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wide">
                  {sceneType === "field" ? "Environmental Control Knobs" : "Photobioreactor Hardware Actuators"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Directly modulates 3D physics & live telemetry
              </span>
            </div>

            {sceneType === "field" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" />
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
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
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
                      <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
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
                    <span>Photosynthetic Saturation</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
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
                    <span>34°C (Thermal Stress)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-emerald-400" />
                      Bubble Pump Flow:
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
                    <span>Laminar Flow</span>
                    <span>Turbulent Sparging</span>
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
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Active Digital Twin
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {sceneType === "field" ? "Sundarbans Blue Carbon Node" : "Dhaka Photobioreactor Node"}
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  {activeNodeId} • {sceneType === "field" ? "125 Hectares" : "Modular 5 ha Array"}
                </span>
              </div>

              <div
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
                  isTampered
                    ? "bg-red-950/80 border-red-500 text-red-400 animate-pulse"
                    : "bg-emerald-950/80 border-emerald-500 text-emerald-400"
                }`}
              >
                {isTampered ? "TAMPERED" : "VERIFIED"}
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#060D0A] border border-emerald-500/15">
                <span className="text-slate-400 block text-[10px] uppercase">Carbon Stock</span>
                <span className="text-base font-bold text-emerald-400">
                  {sceneType === "field" ? derivedFieldMetrics.carbonStock : derivedBioreactorMetrics.carbonStock}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">tCO2e/ha</span>
              </div>

              <div className="p-2.5 rounded bg-[#060D0A] border border-emerald-500/15">
                <span className="text-slate-400 block text-[10px] uppercase">Trust Score</span>
                <span
                  className={`text-base font-bold ${
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
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Soil Moisture</span>
                    <span className="text-slate-200 font-semibold">{derivedFieldMetrics.soilMoisture}%</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Salinity EC</span>
                    <span className="text-slate-200 font-semibold">{derivedFieldMetrics.salinityEc} dS/m</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Soil Temp</span>
                    <span className="text-slate-200 font-semibold">{derivedFieldMetrics.soilTemp}°C</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">NDVI Proxy</span>
                    <span className="text-cyan-400 font-semibold">{derivedFieldMetrics.ndvi}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">CO2 Dissolved</span>
                    <span className="text-slate-200 font-semibold">{derivedBioreactorMetrics.co2Ppm} ppm</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">O2 Evolution</span>
                    <span className="text-emerald-400 font-semibold">{derivedBioreactorMetrics.o2Percent}%</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Turbidity Density</span>
                    <span className="text-slate-200 font-semibold">{derivedBioreactorMetrics.turbidityNtu} NTU</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#060D0A] border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Water Temp</span>
                    <span className="text-cyan-400 font-semibold">{derivedBioreactorMetrics.waterTemp}°C</span>
                  </div>
                </>
              )}
            </div>

            {/* Selected 3D Sub-Component Tag */}
            <div className="p-2 rounded bg-black/40 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-300">
              <span className="text-slate-500 uppercase">Selected 3D Mesh:</span>
              <span className="text-emerald-400 font-semibold">{selectedSensor.replace("_", " ").toUpperCase()}</span>
            </div>

            {/* Tamper Simulation Action Button */}
            <div className="pt-2">
              <button
                onClick={handleSimulateTamper}
                disabled={isTamperingAction || isTampered}
                className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/50 disabled:opacity-50 disabled:hover:bg-red-600"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Sensor Tampering (/simulate/tamper)</span>
              </button>
            </div>
          </div>

          {/* Tamper Audit Log Panel */}
          <div className="glass-card p-4 border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Tamper Audit Trail</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live Quarantine Log</span>
            </div>

            {tamperLogs.length === 0 ? (
              <div className="p-3 rounded bg-[#060D0A] border border-slate-800 text-xs font-mono text-slate-500 text-center">
                Zero active tamper incidents. All nodes operating under verified cryptographic parameters.
              </div>
            ) : (
              <div className="space-y-2">
                {tamperLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-red-950/30 border border-red-500/30 text-[11px] font-mono text-red-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-red-400">{log.nodeId} Alert</span>
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[10px] mb-1">{log.tamperType}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-red-400">Trust: {log.trustScore}%</span>
                      <span className="text-amber-400 font-semibold">Ledger Minting Aborted</span>
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
