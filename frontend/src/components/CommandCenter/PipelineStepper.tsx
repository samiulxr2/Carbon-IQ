"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Satellite,
  Cpu,
  ShieldCheck,
  Hash,
  Award,
  RefreshCw,
  CheckCircle2,
  Clock
} from "lucide-react";

interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  tech: string;
  icon: React.ElementType;
}

const STEPS: PipelineStep[] = [
  {
    id: 1,
    title: "IoT & Satellite Ingestion",
    subtitle: "Sentinel-2 & Ground Telemetry",
    tech: "NDVI, NDWI, Capacitive Soil, Photodiodes",
    icon: Satellite,
  },
  {
    id: 2,
    title: "Edge & Stream Processing",
    subtitle: "15-Min Diurnal Packetization",
    tech: "Micro-Jitter Filter & Time-Series Framing",
    icon: Cpu,
  },
  {
    id: 3,
    title: "AI Calibration & Anomaly Guard",
    subtitle: "XGBoost & IsolationForest",
    tech: "Biophysical Stock (R² 0.9997) + Trust Scoring",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "SHA-256 Ledger",
    subtitle: "Cryptographic Chain Anchor",
    tech: "Prev-Hash Linking & Gatekeeper Audit",
    icon: Hash,
  },
  {
    id: 5,
    title: "Article 6 Credit & Net-Zero",
    subtitle: "Registry Settlement & DNA Proof",
    tech: "ITMO Tokenization & SBTi Retirement",
    icon: Award,
  },
];

interface PipelineStepperProps {
  onTickReceived?: (data: any) => void;
}

export default function PipelineStepper({ onTickReceived }: PipelineStepperProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [lastTickTime, setLastTickTime] = useState<string>("");
  const [tickCounter, setTickCounter] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  // Poll /telemetry/live every 5 seconds
  useEffect(() => {
    let stepInterval: NodeJS.Timeout;

    const pollTelemetry = async () => {
      try {
        setIsStreaming(true);
        // Start animation wave across the 5 steps
        setActiveStep(1);
        let curr = 1;
        stepInterval = setInterval(() => {
          curr += 1;
          if (curr <= 5) {
            setActiveStep(curr);
          } else {
            clearInterval(stepInterval);
          }
        }, 600);

        const res = await fetch("http://127.0.0.1:8000/telemetry/live");
        const data = await res.json();

        setLastTickTime(new Date().toLocaleTimeString());
        setTickCounter((prev) => prev + 1);
        if (onTickReceived) {
          onTickReceived(data);
        }
      } catch (err) {
        console.warn("Polling /telemetry/live failed:", err);
      } finally {
        setTimeout(() => setIsStreaming(false), 3000);
      }
    };

    pollTelemetry();
    const pollTimer = setInterval(pollTelemetry, 5000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(stepInterval);
    };
  }, [onTickReceived]);

  return (
    <div className="glass-card p-6 border-emerald-500/20 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <RefreshCw className={`w-4 h-4 ${isStreaming ? "animate-spin text-cyan-400" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                Continuous MRV Data Pipeline
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live 5s Cadence
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Sentinel-2 & Ground IoT Ingestion $\to$ XGBoost MRV $\to$ SHA-256 Ledger $\to$ Article 6 ITMO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Last Tick:</span>
            <span className="text-white font-semibold">{lastTickTime || "Initializing..."}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#060D0A] border border-emerald-500/20 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ticks: #{tickCounter}</span>
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isPassed = activeStep > step.id;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? "bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/20"
                  : isPassed
                  ? "bg-[#0D1914] border-emerald-500/40 text-slate-300"
                  : "bg-[#060D0A]/70 border-slate-800 text-slate-400"
              }`}
            >
              {/* Active Pulse Glow Bar */}
              {isActive && (
                <motion.div
                  layoutId="active-bar"
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"
                  transition={{ duration: 0.3 }}
                />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-emerald-500 text-black font-bold"
                        : isPassed
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    STEP 0{step.id}
                  </span>
                </div>

                <div className="text-xs font-bold text-white font-sans leading-tight">
                  {step.title}
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                  {step.subtitle}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span className="truncate pr-1">{step.tech}</span>
                {isPassed && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
