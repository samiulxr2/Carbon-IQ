"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Trees,
  ShieldCheck,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

interface KPICountersProps {
  totalCredits?: number;
  marketValueUsd?: number;
  activeNodes?: number;
  systemTrustScore?: number;
}

function AnimatedCounter({
  target,
  decimals = 0,
  prefix = "",
  suffix = ""
}: {
  target: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // ms
    const startVal = prevTargetRef.current;
    prevTargetRef.current = target;

    let frameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (target - startVal) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [target]);

  const formatted = decimals > 0
    ? displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString();

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default function KPICounters({
  totalCredits = 3250.75,
  marketValueUsd = 92646.38,
  activeNodes = 6,
  systemTrustScore = 97.8
}: KPICountersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Verified tCO2e */}
      <div className="glass-card p-5 border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Verified Carbon Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Trees className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1.5">
          <AnimatedCounter target={totalCredits} decimals={2} />
          <span className="text-xs font-normal text-emerald-400">tCO2e</span>
        </div>
        <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="text-emerald-400/90 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            <span>+15-min Accretion</span>
          </span>
          <span className="text-slate-500">Tier 3 Calibrated</span>
        </div>
      </div>

      {/* 2. Article 6 Market Value */}
      <div className="glass-card p-5 border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Article 6 ITMO Valuation
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight flex items-baseline gap-1.5">
          <AnimatedCounter target={marketValueUsd} prefix="$" decimals={2} />
          <span className="text-xs font-normal text-slate-400">USD</span>
        </div>
        <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="text-amber-400/90">$28.50/t Base Price</span>
          <span className="text-slate-500">MoEFCC DNA Authorized</span>
        </div>
      </div>

      {/* 3. Active Nodes */}
      <div className="glass-card p-5 border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Monitored Geo-Nodes
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-cyan-400 tracking-tight flex items-baseline gap-1.5">
          <AnimatedCounter target={activeNodes} />
          <span className="text-xs font-normal text-slate-400">Nodes</span>
        </div>
        <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="text-cyan-400/90 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>5 Field + 1 Bioreactor</span>
          </span>
          <span className="text-slate-500">617.5 Hectares</span>
        </div>
      </div>

      {/* 4. System Trust Score */}
      <div className="glass-card p-5 border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            System Trust Score
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight flex items-baseline gap-1.5">
          <AnimatedCounter target={systemTrustScore} decimals={1} suffix="%" />
          <span className="text-xs font-normal text-slate-400">/ 100</span>
        </div>
        <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="text-emerald-400/90">IsolationForest Verified</span>
          <span className="text-slate-500">Zero Unquarantined Drifts</span>
        </div>
      </div>
    </div>
  );
}
