"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Trees,
  Droplets,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Languages,
  CheckCircle2,
  Sprout
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface StewardInfo {
  name_bn: string;
  name_en: string;
  role_bn: string;
  role_en: string;
  nid: string;
  wallet: string;
  location_bn: string;
  location_en: string;
  species_bn: string;
  species_en: string;
}

interface FinancialData {
  accumulated_credits_tco2e: number;
  carbon_price_usd: number;
  exchange_rate: {
    usd_to_bdt: number;
    label: string;
  };
  gross_earnings_usd: number;
  gross_earnings_bdt: number;
  steward_share_percent: number;
  net_steward_payout_usd: number;
  net_steward_payout_bdt: number;
  sovereign_buffer_bdt: number;
  next_disbursement_date_bn: string;
  next_disbursement_date_en: string;
  payout_status_bn: string;
  payout_status_en: string;
}

interface AdvisoryItem {
  id: string;
  type: "soil" | "water" | "canopy";
  severity: "normal" | "warning" | "critical";
  metric: string;
  metric_name_bn: string;
  metric_name_en: string;
  title_bn: string;
  title_en: string;
  detail_bn: string;
  detail_en: string;
}

interface SMSAlert {
  id: string;
  sender: string;
  carrier: string;
  time_bn: string;
  time_en: string;
  badge_type: string;
  text_bn: string;
  text_en: string;
}

interface VoiceAlert {
  call_id: string;
  caller_title_bn: string;
  caller_title_en: string;
  duration_seconds: number;
  date_bn: string;
  date_en: string;
  audio_wave_simulated: number[];
  transcript_bn: string;
  transcript_en: string;
}

const PLOTS = [
  { id: "NODE-BD-01", label_bn: "সুন্দরবন ম্যানগ্রোভ প্লট (সাতক্ষীরা)", label_en: "Sundarbans Mangrove (Satkhira)", steward: "মোঃ রফিকুল ইসলাম", area: 2.5 },
  { id: "NODE-BD-02", label_bn: "কক্সবাজার লবণভূমি রিজার্ভ (টেকনাফ)", label_en: "Cox's Bazar Saltmarsh (Teknaf)", steward: "আমিনা বেগম", area: 3.0 },
  { id: "NODE-BD-03", label_bn: "রাজশাহী কৃষি-বনায়ন (গোদাগাড়ী)", label_en: "Rajshahi Agroforestry (Godagari)", steward: "আব্দুল করিম", area: 1.8 },
  { id: "NODE-BD-04", label_bn: "সিলেট পিটল্যান্ড জলাভূমি (শ্রীমঙ্গল)", label_en: "Sylhet Peatland (Sreemangal)", steward: "সুনীল খাসিয়া", area: 4.2 }
];

export default function FarmerPortalView() {
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("NODE-BD-01");
  const [, setLoading] = useState<boolean>(true);

  // Live Data States
  const [steward, setSteward] = useState<StewardInfo | null>(null);
  const [financials, setFinancials] = useState<FinancialData | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [smsAlerts, setSmsAlerts] = useState<SMSAlert[]>([]);
  const [voiceAlert, setVoiceAlert] = useState<VoiceAlert | null>(null);

  // Simulated Voice Call Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSeconds, setPlaySeconds] = useState<number>(0);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isBn = lang === "bn";

  const fetchFarmerData = useCallback(async (nodeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/farmer/portal?node_id=${nodeId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSteward(data.steward_profile);
      setFinancials(data.financial_summary);
      setAdvisories(data.environmental_advisories || []);
      setSmsAlerts(data.sms_notifications || []);
      setVoiceAlert(data.voice_call_advisory || null);
    } catch {
      // Fallback fallback defaults if offline
      setFinancials({
        accumulated_credits_tco2e: 45.2,
        carbon_price_usd: 28.50,
        exchange_rate: { usd_to_bdt: 120.50, label: "Demo Fixed Exchange Rate (1 USD = 120.50 BDT)" },
        gross_earnings_usd: 1288.20,
        gross_earnings_bdt: 155228.10,
        steward_share_percent: 85,
        net_steward_payout_usd: 1094.97,
        net_steward_payout_bdt: 131943.88,
        sovereign_buffer_bdt: 23284.22,
        next_disbursement_date_bn: "১ ডিসেম্বর ২০২৬",
        next_disbursement_date_en: "1 December 2026",
        payout_status_bn: "অনুমোদিত ও যাচাইকৃত",
        payout_status_en: "Approved & Verified"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmerData(selectedNodeId);
  }, [selectedNodeId, fetchFarmerData]);

  // Audio simulation timer
  const togglePlay = () => {
    if (isPlaying) {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioIntervalRef.current = setInterval(() => {
        setPlaySeconds((prev) => {
          if (prev >= 17) {
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="glass-card p-5 border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sprout className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-white">
                {isBn ? "স্থানীয় কার্বন সংরক্ষণ ও কৃষক পোর্টাল" : "Community Carbon Stewardship Portal"}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isBn ? "আর্টিকেল ৬.২ সুবিধাভোগী" : "Article 6.2 Beneficiary"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? "আইওটি ও স্যাটেলাইট-যাচাইকৃত আর্নিং, মাটির স্বাস্থ্য নির্দেশিকা ও মোবাইল মেসেজ"
                : "IoT & Satellite-verified Article 6 carbon earnings, soil advisories, and mobile alerts"}
            </p>
          </div>
        </div>

        {/* Language Switcher Buttons (No Flag Emojis) */}
        <div className="flex items-center p-0.5 rounded-[6px] bg-[#060D0A] border border-slate-800 text-xs">
          <button
            onClick={() => setLang("bn")}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
              isBn
                ? "bg-emerald-500 text-black font-semibold font-bengali"
                : "text-slate-400 hover:text-white"
            }`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors font-mono ${
              !isBn
                ? "bg-emerald-500 text-black font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Plot Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PLOTS.map((plot) => {
          const isSelected = plot.id === selectedNodeId;
          return (
            <button
              key={plot.id}
              onClick={() => setSelectedNodeId(plot.id)}
              className={`p-3 rounded-[6px] border text-left transition-colors ${
                isSelected
                  ? "bg-[#0D1914] border-emerald-500/60 ring-1 ring-emerald-500/30"
                  : "bg-[#0D1914] border-slate-800 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-emerald-400 font-semibold">{plot.id}</span>
                <span className="text-slate-500">{plot.area} ha</span>
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {isBn ? plot.label_bn : plot.label_en}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {plot.steward}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Financials & Profile + Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Financial Earnings & Steward Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steward Profile & Gross Payout Card */}
          <div className="glass-card p-5 border-emerald-500/20 space-y-4">
            {/* Steward Profile Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Sprout className="w-5 h-5 text-emerald-400" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {isBn ? steward?.name_bn : steward?.name_en}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" strokeWidth={1.75} />
                      {isBn ? "এনআইডি যাচাইকৃত" : "NID Verified"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isBn ? steward?.role_bn : steward?.role_en} &bull; {isBn ? steward?.location_bn : steward?.location_en}
                  </p>
                  <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                    {isBn ? `সংরক্ষিত প্রজাতি: ${steward?.species_bn}` : `Stewardship Species: ${steward?.species_en}`}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-[10px] text-slate-500">{isBn ? "মোবাইল ওয়ালেট" : "Mobile Wallet"}</div>
                <div className="text-emerald-400 font-semibold text-xs">{steward?.wallet}</div>
                <div className="text-[10px] text-slate-500">NID: {steward?.nid}</div>
              </div>
            </div>

            {/* Earnings Big Numbers Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* BDT Earnings Card */}
              <div className="p-3.5 rounded-[6px] bg-[#060D0A] border border-emerald-500/25 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isBn ? "মোট অর্জিত আয় (টাকা)" : "Total Gross Earnings (BDT)"}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
                    {isBn ? "টাকা" : "BDT"}
                  </span>
                </div>
                <div className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-1.5 font-mono">
                  <span className="text-emerald-400">৳</span>
                  <span>{financials?.gross_earnings_bdt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {isBn ? "সমমূল্য মার্কিন ডলার:" : "Equivalent USD Value:"}{" "}
                  <span className="text-emerald-400 font-medium font-mono">
                    ${financials?.gross_earnings_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              {/* Accumulated Credits Card */}
              <div className="p-3.5 rounded-[6px] bg-[#060D0A] border border-cyan-500/25 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isBn ? "যাচাইকৃত সঞ্চিত কার্বন ক্রেডিট" : "Verified Accumulated Credits"}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400">
                    Article 6.2
                  </span>
                </div>
                <div className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-1.5 font-mono">
                  <span className="text-cyan-400">
                    {financials?.accumulated_credits_tco2e.toFixed(1)}
                  </span>
                  <span className="text-xs font-normal text-slate-400">tCO2e</span>
                </div>
                <div className="text-xs text-slate-400">
                  {isBn ? "আন্তর্জাতিক বাজার মূল্য:" : "Market Price per Ton:"}{" "}
                  <span className="text-cyan-400 font-medium font-mono">
                    ${financials?.carbon_price_usd.toFixed(2)}/t
                  </span>
                </div>
              </div>
            </div>

            {/* Clearly Labeled Demo Exchange Rate Notice */}
            <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-amber-500/25 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-medium">
                  {isBn
                    ? "ডেমো নির্ধারিত বিনিময় হার: ১ মার্কিন ডলার = ১২০.৫০ টাকা"
                    : "Demo Fixed Exchange Rate: 1 USD = 120.50 BDT"}
                </span>
              </div>
              <span className="text-[10px] uppercase text-slate-500">
                {isBn ? "স্থির ডেমো রেট" : "Fixed Demo Rate"}
              </span>
            </div>

            {/* Financial Breakdown & Sovereign Resilience Fund */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isBn ? "কৃষক নিট প্রাপ্তি (৮৫%)" : "Steward Net Payout (85%)"}
                </div>
                <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
                  ৳{financials?.net_steward_payout_bdt.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ${financials?.net_steward_payout_usd.toFixed(2)} USD
                </div>
              </div>

              <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isBn ? "সার্বভৌম তহবিল (১৫%)" : "Sovereign Buffer (15%)"}
                </div>
                <div className="text-sm font-semibold text-slate-300 font-mono mt-0.5">
                  ৳{financials?.sovereign_buffer_bdt.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isBn ? "উপকূলীয় দুর্যোগ ব্যবস্থাপনা" : "Coastal Disaster Fund"}
                </div>
              </div>

              <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isBn ? "পরবর্তী অর্থ বিতরণ" : "Next Disbursement"}
                </div>
                <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                  {isBn ? financials?.next_disbursement_date_bn : financials?.next_disbursement_date_en}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                  {isBn ? "অন-চেইন অনুমোদিত" : "On-Chain Approved"}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Soil & Water Telemetry Advisories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                <span>{isBn ? "লাইভ সেন্সর ও পরিবেশ পরামর্শ" : "Environmental Advisories"}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {isBn ? "টেলিমেট্রি থেকে সংগৃহীত" : "Derived from IoT Telemetry"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {advisories.map((adv) => {
                const isCrit = adv.severity === "critical";
                const isWarn = adv.severity === "warning";

                return (
                  <div
                    key={adv.id}
                    className={`p-3 rounded-[6px] border space-y-2 ${
                      isCrit
                        ? "border-red-500/30 bg-red-950/15"
                        : isWarn
                        ? "border-amber-500/30 bg-amber-950/15"
                        : "border-emerald-500/20 bg-[#0D1914]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        {isBn ? adv.metric_name_bn : adv.metric_name_en}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                          isCrit
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : isWarn
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {adv.metric}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white leading-tight">
                      {isBn ? adv.title_bn : adv.title_en}
                    </h4>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {isBn ? adv.detail_bn : adv.detail_en}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Mobile SMS Feed & Simulated Voice Player */}
        <div className="space-y-6">
          {/* Simulated Mobile Phone SMS Alerts */}
          <div className="glass-card p-4 border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  {isBn ? "মোবাইল এসএমএস নোটিফিকেশন" : "SMS Alerts (Simulated)"}
                </h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                Teletalk / GP
              </span>
            </div>

            {/* Mobile SMS Message Bubble Feed */}
            <div className="space-y-2.5">
              {smsAlerts.map((sms) => (
                <div
                  key={sms.id}
                  className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-400 font-semibold">{sms.sender}</span>
                    <span className="text-slate-500">{isBn ? sms.time_bn : sms.time_en}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">
                    {isBn ? sms.text_bn : sms.text_en}
                  </p>
                  <div className="text-[9px] font-mono text-slate-500 text-right">
                    {sms.carrier} &bull; Verified SMS
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Voice Call Audio Player Simulation */}
          <div className="glass-card p-4 border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" strokeWidth={1.75} />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  {isBn ? "ভয়েস কল বার্তা" : "Voice IVR Advisory"}
                </h3>
              </div>
              <span className="text-[9px] font-mono text-cyan-400">
                {voiceAlert?.date_bn || "২০২৬"}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-medium">
              {isBn ? voiceAlert?.caller_title_bn : voiceAlert?.caller_title_en}
            </p>

            {/* Audio Wave Visualizer Bars */}
            <div className="p-3 rounded-[6px] bg-[#060D0A] border border-cyan-500/20 space-y-2.5">
              <div className="flex items-center gap-1.5 h-8 px-2 justify-between">
                {(voiceAlert?.audio_wave_simulated || [30, 60, 40, 80, 50, 90, 70, 30, 85, 95, 60, 40]).map((h, i) => {
                  const isActive = isPlaying && i <= (playSeconds % 18);
                  return (
                    <div
                      key={i}
                      style={{ height: `${isPlaying ? Math.max(15, (h * (Math.sin(playSeconds + i) + 1.2)) % 100) : h}%` }}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-cyan-400"
                          : "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={togglePlay}
                  className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 fill-black" strokeWidth={1.75} />
                      <span>{isBn ? "থামান" : "Pause"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-black" strokeWidth={1.75} />
                      <span>{isBn ? "শুনুন" : "Play Voice Call"}</span>
                    </>
                  )}
                </button>

                <div className="text-xs font-mono text-slate-400">
                  <span className="text-cyan-400 font-semibold">
                    0:{playSeconds < 10 ? `0${playSeconds}` : playSeconds}
                  </span>{" "}
                  / 0:18s
                </div>
              </div>
            </div>

            {/* Voice Transcript Display */}
            <div className="p-2.5 rounded-[6px] bg-[#060D0A] border border-slate-800 text-[11px] text-slate-300 leading-relaxed italic">
              &quot;{isBn ? voiceAlert?.transcript_bn : voiceAlert?.transcript_en}&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
