"use client";

import React, { useState, useEffect } from "react";
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
import { API_URL } from "@/lib/config";

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
    title: "Ingestion & Telemetry",
    subtitle: "Sentinel-2 & Ground IoT",
    tech: "NDVI, NDWI, Capacitive Soil, Micro-Sensors",
    icon: Satellite,
  },
  {
    id: 2,
    title: "Stream Processing",
    subtitle: "15-Min Telemetry Packetization",
    tech: "Micro-Jitter Filter & Time-Series Framing",
    icon: Cpu,
  },
  {
    id: 3,
    title: "AI Calibration",
    subtitle: "XGBoost & Fraud Detection",
    tech: "Biophysical Stock + Trust Scoring",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "SHA-256 Ledger",
    subtitle: "Cryptographic Hash Chain",
    tech: "Prev-Hash Linking & Gatekeeper Audit",
    icon: Hash,
  },
  {
    id: 5,
    title: "Article 6 Issuance",
    subtitle: "Registry Settlement",
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

        const res = await fetch(`${API_URL}/telemetry/live`);
        const data = await res.json();

        setLastTickTime(new Date().toLocaleTimeString());
        setTickCounter((prev) => prev + 1);
        if (onTickReceived) {
          onTickReceived(data);
        }
      } catch (err) {
        console.warn("Polling /telemetry/live failed:", err);
      } finally {
        setTimeout(() => setIsStreaming(false), 2500);
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
    <div className="glass-card p-5 border-emerald-500/20 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <RefreshCw
              className={`w-4 h-4 ${isStreaming ? "animate-spin text-emerald-400" : ""}`}
              strokeWidth={1.75}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Verification Pipeline
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                5s Interval
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sensor Ingestion &rarr; XGBoost MRV &rarr; SHA-256 Ledger &rarr; Article 6 Issuance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span className="text-slate-400">Last Sync:</span>
            <span className="text-white font-medium">{lastTickTime || "Initializing..."}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#060D0A] border border-slate-800 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Cycle #{tickCounter}</span>
          </div>
        </div>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isPassed = activeStep > step.id;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-[6px] border transition-colors flex flex-col justify-between ${
                isActive
                  ? "bg-[#0D1914] border-emerald-500/60"
                  : isPassed
                  ? "bg-[#0D1914] border-emerald-500/30 text-slate-300"
                  : "bg-[#060D0A]/70 border-slate-800 text-slate-400"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-6 h-6 rounded-[4px] flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-emerald-500 text-black font-bold"
                        : isPassed
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    0{step.id}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white leading-tight">
                  {step.title}
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                  {step.subtitle}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span className="truncate pr-1">{step.tech}</span>
                {isPassed && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={1.75} />
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
