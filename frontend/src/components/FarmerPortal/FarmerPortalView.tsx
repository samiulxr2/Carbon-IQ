"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet,
  Trees,
  Droplets,
  Thermometer,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Radio,
  PhoneCall,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Languages,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

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
  const [backendUrl, setBackendUrl] = useState<string>("http://127.0.0.1:8000");

  const [steward, setSteward] = useState<StewardInfo | null>(null);
  const [financials, setFinancials] = useState<FinancialData | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [smsAlerts, setSmsAlerts] = useState<SMSAlert[]>([]);
  const [voiceAlert, setVoiceAlert] = useState<VoiceAlert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Audio voice player simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSeconds, setPlaySeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname || "127.0.0.1";
      setBackendUrl(`http://${host}:8000`);
    }
  }, []);

  const fetchFarmerData = useCallback(async () => {
    setLoading(true);
    try {
      const plot = PLOTS.find((p) => p.id === selectedNodeId) || PLOTS[0];
      const [earnRes, advRes] = await Promise.all([
        fetch(`${backendUrl}/farmer/earnings?node_id=${selectedNodeId}&plot_area_ha=${plot.area}`),
        fetch(`${backendUrl}/farmer/advisories?node_id=${selectedNodeId}`)
      ]);

      if (earnRes.ok) {
        const earnData = await earnRes.json();
        setSteward(earnData.steward);
        setFinancials(earnData.financials);
      }

      if (advRes.ok) {
        const advData = await advRes.json();
        setAdvisories(advData.advisories || []);
        setSmsAlerts(advData.sms_alerts || []);
        setVoiceAlert(advData.voice_alert || null);
      }
    } catch (e) {
      console.error("Failed to fetch farmer portal data", e);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, selectedNodeId]);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  // Voice player timer simulation
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setPlaySeconds((prev) => {
          if (prev >= 18) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (playSeconds >= 18) setPlaySeconds(0);
      setIsPlaying(true);
    }
  };

  const isBn = lang === "bn";

  return (
    <div className={`space-y-6 ${isBn ? "font-bengali" : "font-sans"}`}>
      {/* Top Banner with Language Toggle */}
      <div className="glass-card p-4 border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {isBn ? "কৃষক ও উপকূলীয় বনায়ন পোর্টাল" : "Farmer & Coastal Restoration Portal"}
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {isBn ? "ফেজ ৫ সক্রিয়" : "Phase 5 Active"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? "আইওটি সেন্সর ও স্যাটেলাইট ভিত্তিক যাচাইকৃত কার্বন আয় এবং রিয়েল-টাইম কৃষি পরামর্শ"
                : "IoT & Satellite-verified Article 6 carbon earnings, soil advisories, and mobile alerts"}
            </p>
          </div>
        </div>

        {/* Language Switcher Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-[#060D0A] border border-emerald-500/25">
            <button
              onClick={() => setLang("bn")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                isBn
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-bengali"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇧🇩</span>
              <span>বাংলা</span>
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 font-mono ${
                !isBn
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plot Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {PLOTS.map((plot) => {
          const isSelected = plot.id === selectedNodeId;
          return (
            <button
              key={plot.id}
              onClick={() => setSelectedNodeId(plot.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "glass-card border-slate-800 hover:border-emerald-500/30"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-emerald-400 font-bold">{plot.id}</span>
                <span className="text-slate-400">{plot.area} ha</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {isBn ? plot.label_bn : plot.label_en}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {plot.steward}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Section 1 (Financials & Steward Profile) + Section 2 (Soil/Water Advisories) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Financial Earnings & Steward Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steward Profile & Gross Payout Card */}
          <div className="glass-card p-5 border-emerald-500/20 space-y-5">
            {/* Steward Profile Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                  👨‍🌾
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {isBn ? steward?.name_bn : steward?.name_en}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {isBn ? "এনআইডি যাচাইকৃত" : "NID Verified"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isBn ? steward?.role_bn : steward?.role_en} • {isBn ? steward?.location_bn : steward?.location_en}
                  </p>
                  <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                    {isBn ? `সংরক্ষিত প্রজাতি: ${steward?.species_bn}` : `Stewardship Species: ${steward?.species_en}`}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-[10px] text-slate-400">{isBn ? "মোবাইল ওয়ালেট" : "Mobile Wallet"}</div>
                <div className="text-emerald-400 font-bold text-xs">{steward?.wallet}</div>
                <div className="text-[10px] text-slate-500">NID: {steward?.nid}</div>
              </div>
            </div>

            {/* Earnings Big Numbers Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BDT Earnings Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isBn ? "মোট অর্জিত আয় (টাকা)" : "Total Gross Earnings (BDT)"}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {isBn ? "টাকা" : "BDT"}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
                  <span className="text-emerald-400 font-mono">৳</span>
                  <span>{financials?.gross_earnings_bdt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {isBn ? "সমমূল্য মার্কিন ডলার:" : "Equivalent USD Value:"}{" "}
                  <span className="text-emerald-400 font-bold font-mono">
                    ${financials?.gross_earnings_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              {/* Accumulated Credits Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isBn ? "যাচাইকৃত সঞ্চিত কার্বন ক্রেডিট" : "Verified Accumulated Credits"}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Article 6.2
                  </span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
                  <span className="text-cyan-400 font-mono">
                    {financials?.accumulated_credits_tco2e.toFixed(1)}
                  </span>
                  <span className="text-sm font-normal text-slate-400 font-mono">tCO2e</span>
                </div>
                <div className="text-xs text-slate-400">
                  {isBn ? "আন্তর্জাতিক বাজার মূল্য:" : "Market Price per Ton:"}{" "}
                  <span className="text-cyan-400 font-bold font-mono">
                    ${financials?.carbon_price_usd.toFixed(2)}/t
                  </span>
                </div>
              </div>
            </div>

            {/* Clearly Labeled Demo Exchange Rate Notice */}
            <div className="p-2.5 rounded-lg bg-[#060D0A] border border-amber-500/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold">
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
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isBn ? "কৃষক নিট প্রাপ্তি (৮৫%)" : "Steward Net Payout (85%)"}
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  ৳{financials?.net_steward_payout_bdt.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ${financials?.net_steward_payout_usd.toFixed(2)} USD
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isBn ? "সার্বভৌম তহবিল (১৫%)" : "Sovereign Buffer (15%)"}
                </div>
                <div className="text-base font-bold text-slate-300 font-mono mt-0.5">
                  ৳{financials?.sovereign_buffer_bdt.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isBn ? "উপকূলীয় দুর্যোগ ব্যবস্থাপনা" : "Coastal Disaster Fund"}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">
                  {isBn ? "পরবর্তী অর্থ বিতরণ" : "Next Disbursement"}
                </div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">
                  {isBn ? financials?.next_disbursement_date_bn : financials?.next_disbursement_date_en}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  {isBn ? "অন-চেইন অনুমোদিত" : "On-Chain Approved"}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Soil & Water Telemetry Advisories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>{isBn ? "লাইভ সেন্সর ও আবহাওয়া পরামর্শ" : "Live Soil & Water Environmental Advisories"}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {isBn ? "আইওটি টেলিমেট্রি থেকে সংগৃহীত" : "Derived from Live IoT Telemetry"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {advisories.map((adv) => {
                const isCrit = adv.severity === "critical";
                const isWarn = adv.severity === "warning";

                return (
                  <div
                    key={adv.id}
                    className={`p-4 rounded-xl border glass-card space-y-2.5 ${
                      isCrit
                        ? "border-red-500/40 bg-red-950/15"
                        : isWarn
                        ? "border-amber-500/40 bg-amber-950/15"
                        : "border-emerald-500/25 bg-emerald-950/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        {isBn ? adv.metric_name_bn : adv.metric_name_en}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
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

                    <h4 className="text-xs font-bold text-white leading-tight">
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
          <div className="glass-card p-4 border-emerald-500/20 space-y-3.5">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isBn ? "মোবাইল এসএমএস সতর্কতা" : "Simulated SMS Notifications"}
                </h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                Teletalk / GP
              </span>
            </div>

            {/* Mobile SMS Message Bubble Feed */}
            <div className="space-y-3">
              {smsAlerts.map((sms) => (
                <div
                  key={sms.id}
                  className="p-3 rounded-xl bg-[#060D0A]/90 border border-emerald-500/20 shadow-md space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-400 font-bold">{sms.sender}</span>
                    <span className="text-slate-500">{isBn ? sms.time_bn : sms.time_en}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">
                    {isBn ? sms.text_bn : sms.text_en}
                  </p>
                  <div className="text-[9px] font-mono text-slate-500 text-right">
                    {sms.carrier} • Verified SMS
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Voice Call Audio Player Simulation */}
          <div className="glass-card p-4 border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isBn ? "স্বয়ংক্রিয় ভয়েস কল বার্তা" : "Simulated Voice IVR Advisory"}
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
            <div className="p-3 rounded-xl bg-[#060D0A] border border-cyan-500/25 space-y-2.5">
              <div className="flex items-center gap-1.5 h-10 px-2 justify-between">
                {(voiceAlert?.audio_wave_simulated || [30, 60, 40, 80, 50, 90, 70, 30, 85, 95, 60, 40]).map((h, i) => {
                  const isActive = isPlaying && i <= (playSeconds % 18);
                  return (
                    <div
                      key={i}
                      style={{ height: `${isPlaying ? Math.max(15, (h * (Math.sin(playSeconds + i) + 1.2)) % 100) : h}%` }}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-cyan-400 shadow-sm shadow-cyan-400/50"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-black" />
                      <span>{isBn ? "থামান" : "Pause"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>{isBn ? "বার্তা শুনুন" : "Play Voice Call"}</span>
                    </>
                  )}
                </button>

                <div className="text-xs font-mono text-slate-400">
                  <span className="text-cyan-400 font-bold">
                    0:{playSeconds < 10 ? `0${playSeconds}` : playSeconds}
                  </span>{" "}
                  / 0:18s
                </div>
              </div>
            </div>

            {/* Voice Transcript Display */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed italic">
              &quot;{isBn ? voiceAlert?.transcript_bn : voiceAlert?.transcript_en}&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
