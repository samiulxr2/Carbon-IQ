"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sliders,
  Cpu,
  Trees,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Award,
  Zap,
  Target
} from "lucide-react";

interface TrajectoryPoint {
  year: number;
  gross_emissions_tco2e: number;
  carbon_removal_tco2e: number;
  net_emissions_tco2e: number;
  pct_to_netzero: number;
}

interface Milestone {
  phase: string;
  title: string;
  status: string;
}

interface NetZeroData {
  target_year: number;
  years_remaining: number;
  annual_gross_emissions_tco2e: number;
  target_removal_needed_tco2e: number;
  direct_reduction_pct_achieved: number;
  assets_required: {
    microalgae_bioreactors_count: number;
    microalgae_annual_removal_tco2e: number;
    blue_carbon_mangrove_ha: number;
    blue_carbon_annual_removal_tco2e: number;
    total_annual_removal_capacity_tco2e: number;
  };
  financial_estimation_usd: {
    bioreactor_capex_usd: number;
    blue_carbon_capex_usd: number;
    total_capex_usd: number;
    estimated_payback_years: number;
  };
  timeline_trajectory: TrajectoryPoint[];
  milestones: Milestone[];
}

export default function NetZeroSimulator() {
  const [monthlyEmissions, setMonthlyEmissions] = useState<number>(450);
  const [targetYear, setTargetYear] = useState<number>(2030);
  const [blueCarbonRatio, setBlueCarbonRatio] = useState<number>(0.65);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<NetZeroData | null>(null);

  const calculatePathway = useCallback(async (emissions: number, year: number, ratio: number) => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/netzero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_emissions_tco2e: emissions,
          target_year: year,
          blue_carbon_ratio: ratio
        })
      });
      const data = await res.json();
      if (data.netzero_pathway) {
        setResult(data.netzero_pathway);
      }
    } catch (err) {
      console.error("NetZero calculation failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced calculation on slider change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePathway(monthlyEmissions, targetYear, blueCarbonRatio);
    }, 250);

    return () => clearTimeout(timer);
  }, [monthlyEmissions, targetYear, blueCarbonRatio, calculatePathway]);

  const p = result;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Corporate Net-Zero Strategy Simulator
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  SBTi 1.5°C Aligned
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Dynamic Portfolio Allocation • Microalgae PBRs + Mangrove Blue Carbon • Article 6 Economics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-[#060D0A] px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Article 6.2 Carbon Value: <strong>$28.50/t</strong></span>
          </div>
        </div>

        {/* Quick Emission Presets */}
        <div className="mt-5 pt-4 border-t border-emerald-500/15 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider">Presets:</span>
          {[
            { label: "SME (250 t/mo)", val: 250 },
            { label: "Industrial (450 t/mo)", val: 450 },
            { label: "Heavy Mfg (1,200 t/mo)", val: 1200 },
            { label: "Conglomerate (2,500 t/mo)", val: 2500 }
          ].map((preset) => (
            <button
              key={preset.val}
              onClick={() => setMonthlyEmissions(preset.val)}
              className={`px-2.5 py-1 rounded border transition-colors ${
                monthlyEmissions === preset.val
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold"
                  : "bg-[#060D0A] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="glass-card p-6 border-emerald-500/20 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Monthly Emissions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                Monthly Emissions:
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                {monthlyEmissions.toLocaleString()} <span className="text-xs font-normal text-slate-400">tCO2e</span>
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="3500"
              step="25"
              value={monthlyEmissions}
              onChange={(e) => setMonthlyEmissions(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50 t/mo</span>
              <span>Annual: {(monthlyEmissions * 12).toLocaleString()} tCO2e</span>
              <span>3,500 t/mo</span>
            </div>
          </div>

          {/* Slider 2: Target Net-Zero Year */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Target Year:
              </span>
              <span className="text-cyan-400 font-bold text-sm">
                {targetYear} <span className="text-xs font-normal text-slate-400">({targetYear - 2026} yrs)</span>
              </span>
            </div>
            <input
              type="range"
              min="2027"
              max="2045"
              step="1"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>2027 (Rapid)</span>
              <span>2030 (SBTi Standard)</span>
              <span>2045 (Long-Term)</span>
            </div>
          </div>

          {/* Slider 3: Blue Carbon vs Bioreactor Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Trees className="w-4 h-4 text-emerald-400" />
                Blue Carbon Allocation:
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                {Math.round(blueCarbonRatio * 100)}% <span className="text-xs font-normal text-slate-400">Mangrove</span>
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={blueCarbonRatio}
              onChange={(e) => setBlueCarbonRatio(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10% Mangrove / 90% Algae</span>
              <span>{Math.round((1 - blueCarbonRatio) * 100)}% Algae PBR</span>
              <span>90% Mangrove / 10% Algae</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Requirements & Financial KPI Cards */}
      {p && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 border-emerald-500/20">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Microalgae PBRs
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {p.assets_required.microalgae_bioreactors_count.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Cap: {p.assets_required.microalgae_annual_removal_tco2e.toLocaleString()} tCO2e/yr
            </div>
          </div>

          <div className="glass-card p-4 border-emerald-500/20">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Mangrove Wetland
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {p.assets_required.blue_carbon_mangrove_ha.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-400">ha</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Cap: {p.assets_required.blue_carbon_annual_removal_tco2e.toLocaleString()} tCO2e/yr
            </div>
          </div>

          <div className="glass-card p-4 border-emerald-500/20">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Total CapEx Investment
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">
              ${(p.financial_estimation_usd.total_capex_usd / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Payback: {p.financial_estimation_usd.estimated_payback_years} years
            </div>
          </div>

          <div className="glass-card p-4 border-emerald-500/20">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              SBTi Direct Reduction
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {p.direct_reduction_pct_achieved}%
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Residual Removal: {p.target_removal_needed_tco2e.toLocaleString()} t/yr
            </div>
          </div>
        </div>
      )}

      {/* Trajectory Visual Chart */}
      {p && p.timeline_trajectory && (
        <div className="glass-card p-6 border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                Decarbonization Trajectory Curve (2026 $\to$ {p.target_year})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80" />
                <span>Gross Emissions</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Engineered Carbon Removal</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                <span>Net Balance</span>
              </span>
            </div>
          </div>

          {/* Animated Bar / Visual Trajectory */}
          <div className="space-y-3 pt-2">
            {p.timeline_trajectory.map((step) => {
              const maxVal = p.annual_gross_emissions_tco2e;
              const grossPct = Math.round((step.gross_emissions_tco2e / maxVal) * 100);
              const removalPct = Math.round((step.carbon_removal_tco2e / maxVal) * 100);
              const netPct = Math.round((step.net_emissions_tco2e / maxVal) * 100);

              return (
                <div key={step.year} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white w-14">{step.year}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="text-red-400">Gross: {step.gross_emissions_tco2e.toLocaleString()} t</span>
                      <span className="text-emerald-400">Removal: {step.carbon_removal_tco2e.toLocaleString()} t</span>
                      <span className="text-cyan-300 font-bold">Net: {step.net_emissions_tco2e.toLocaleString()} t</span>
                    </div>
                    <span className="font-bold text-emerald-400 w-12 text-right">{step.pct_to_netzero}%</span>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex relative">
                    {/* Gross Emissions Bar */}
                    <div
                      style={{ width: `${grossPct}%` }}
                      className="h-full bg-red-500/60 transition-all duration-500"
                    />
                    {/* Removal Overlap Indicator */}
                    <div
                      style={{ width: `${Math.min(removalPct, 100)}%` }}
                      className="h-full bg-emerald-500 absolute top-0 left-0 opacity-75 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Breakdown */}
          <div className="overflow-x-auto pt-3 border-t border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-2">
                  <th className="py-2">Milestone Year</th>
                  <th className="py-2">Gross Scope 1-3</th>
                  <th className="py-2">Carbon Removal</th>
                  <th className="py-2">Net Corporate Balance</th>
                  <th className="py-2 text-right">Net-Zero Alignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {p.timeline_trajectory.map((r) => (
                  <tr key={r.year} className="hover:bg-slate-900/50">
                    <td className="py-2 font-bold text-white">{r.year}</td>
                    <td className="py-2 text-red-400">{r.gross_emissions_tco2e.toLocaleString()} tCO2e</td>
                    <td className="py-2 text-emerald-400">{r.carbon_removal_tco2e.toLocaleString()} tCO2e</td>
                    <td className="py-2 font-bold text-cyan-300">{r.net_emissions_tco2e.toLocaleString()} tCO2e</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.pct_to_netzero === 100
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-300"
                      }`}>
                        {r.pct_to_netzero}% Target Achieved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
