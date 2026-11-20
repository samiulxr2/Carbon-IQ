"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { TrendingUp, DollarSign, RefreshCw, AlertCircle } from "lucide-react";

interface MonthlyForecastItem {
  month_step: number;
  month_number: number;
  month_name: string;
  season: string;
  incremental_credits_tco2e: number;
  cumulative_credits_tco2e: number;
  cumulative_value_usd: number;
}

interface ForecastChartProps {
  nodeId: string;
  nodeName?: string;
  backendUrl: string;
}

export default function ForecastChart({
  nodeId,
  backendUrl
}: ForecastChartProps) {
  const [horizon, setHorizon] = useState<6 | 12>(12);
  const [pricePerTon, setPricePerTon] = useState<number>(28.50);
  const [schedule, setSchedule] = useState<MonthlyForecastItem[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [areaHa, setAreaHa] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: nodeId,
          horizon_months: horizon,
          price_per_ton_usd: pricePerTon
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const fc = json.forecast || {};
      setSchedule(fc.monthly_schedule || []);
      setTotalCredits(fc.total_forecasted_credits_tco2e || 0);
      setTotalRevenue(fc.total_forecasted_revenue_usd || 0);
      setAreaHa(fc.area_ha || 100);
    } catch (err: any) {
      setError(err.message || "Failed to load forecast model");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, nodeId, horizon, pricePerTon]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return (
    <div className="glass-card p-5 border-emerald-500/20 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {horizon}-Month Carbon Yield &amp; Revenue Forecast
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {nodeId}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            GradientBoostingRegressor predicting Article 6.2 ITMO credit generation &amp; USD cash flow
          </p>
        </div>

        {/* Controls: Horizon & Price */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Toggle */}
          <div className="flex items-center rounded-[6px] bg-[#060D0A] border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setHorizon(6)}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
                horizon === 6
                  ? "bg-cyan-500 text-black font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setHorizon(12)}
              className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
                horizon === 12
                  ? "bg-cyan-500 text-black font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              12 Months
            </button>
          </div>

          {/* Price Selector */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#060D0A] border border-slate-800 text-xs font-mono">
            <DollarSign className="w-3 h-3 text-cyan-400" strokeWidth={1.75} />
            <span className="text-slate-400 text-[11px]">Price:</span>
            <select
              value={pricePerTon}
              onChange={(e) => setPricePerTon(parseFloat(e.target.value))}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="25.00" className="bg-[#0D1914] text-white">$25/t (Base)</option>
              <option value="28.50" className="bg-[#0D1914] text-white">$28.50/t (Article 6.2)</option>
              <option value="35.00" className="bg-[#0D1914] text-white">$35/t (Premium)</option>
              <option value="45.00" className="bg-[#0D1914] text-white">$45/t (High-Integrity)</option>
            </select>
          </div>

          <button
            onClick={fetchForecast}
            title="Refresh Forecast"
            className="p-1.5 rounded-[6px] bg-[#060D0A] border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
          <div className="text-[10px] text-slate-500">Total Credits Yield</div>
          <div className="text-emerald-400 font-semibold text-sm">
            {totalCredits.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t
          </div>
        </div>
        <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
          <div className="text-[10px] text-slate-500">Projected Valuation</div>
          <div className="text-cyan-400 font-semibold text-sm">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD
          </div>
        </div>
        <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
          <div className="text-[10px] text-slate-500">Yield Density</div>
          <div className="text-white font-semibold">
            {(totalCredits / (areaHa || 1)).toFixed(2)} t/ha/yr
          </div>
        </div>
        <div className="p-2 rounded-[6px] bg-[#060D0A] border border-slate-800">
          <div className="text-[10px] text-slate-500">Peak Window</div>
          <div className="text-amber-400 font-semibold truncate">Monsoon Jun&ndash;Sep</div>
        </div>
      </div>

      {/* Recharts Composed Curve */}
      <div className="w-full h-[300px]">
        {loading && schedule.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-slate-500 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" strokeWidth={1.75} />
            <span>Simulating forward credit generation curve...</span>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center font-mono text-xs text-red-400 gap-2">
            <AlertCircle className="w-5 h-5" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={schedule} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastCreditsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16, 185, 129, 0.08)" />
              <XAxis
                dataKey="month_name"
                stroke="#64748B"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
              />
              <YAxis
                yAxisId="credits"
                stroke="#10B981"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                unit=" t"
              />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                stroke="#06B6D4"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                unit=" $"
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as MonthlyForecastItem;
                    return (
                      <div className="p-3 rounded-[6px] bg-[#0D1914] border border-slate-800 shadow-xl font-mono text-xs space-y-1.5 z-50">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-semibold text-white">{label} (Month {d.month_step})</span>
                          <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                            {d.season}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-emerald-400 font-medium">
                          <span>Cumulative Credits:</span>
                          <span>{d.cumulative_credits_tco2e.toFixed(2)} t</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-cyan-400 font-medium">
                          <span>Valuation:</span>
                          <span>${d.cumulative_value_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-300 text-[10px] border-t border-slate-800 pt-1">
                          <span>Monthly Increment:</span>
                          <span className="text-white">+{d.incremental_credits_tco2e.toFixed(2)} t/mo</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: 10,
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace"
                }}
              />

              <Bar
                yAxisId="credits"
                dataKey="incremental_credits_tco2e"
                name="Monthly Yield Increment (tCO2e)"
                fill="rgba(16, 185, 129, 0.2)"
                stroke="#10B981"
                radius={[3, 3, 0, 0]}
              />

              <Area
                yAxisId="credits"
                type="monotone"
                dataKey="cumulative_credits_tco2e"
                name="Cumulative Credits (tCO2e)"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#forecastCreditsGradient)"
              />

              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="cumulative_value_usd"
                name="Cumulative Value ($USD)"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "#06B6D4" }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
