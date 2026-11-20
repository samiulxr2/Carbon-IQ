"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommandCenterView from "@/components/CommandCenter/CommandCenterView";
import GeoAnalyticsView from "@/components/GeoMap/GeoAnalyticsView";
import FarmerPortalView from "@/components/FarmerPortal/FarmerPortalView";
import NetZeroSimulator from "@/components/NetZero/NetZeroSimulator";
import LedgerView from "@/components/Ledger/LedgerView";
import DigitalTwinViewer from "@/components/DigitalTwin/DigitalTwinViewer";
import CopilotPanel from "@/components/CopilotPanel";
import {
  LayoutDashboard,
  MapPin,
  Sprout,
  Target,
  Hash,
  Activity,
  Sparkles
} from "lucide-react";

type TabKey = "command_center" | "geo_map" | "farmer_portal" | "netzero_simulator" | "ledger" | "digital_twin" | "copilot";

interface TabItem {
  key: TabKey;
  label: string;
  badge?: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: "command_center",
    label: "Command Center",
    badge: "Live 5s",
    icon: LayoutDashboard
  },
  {
    key: "geo_map",
    label: "Geo Map & Analytics",
    badge: "Phase 3",
    icon: MapPin
  },
  {
    key: "farmer_portal",
    label: "কৃষক পোর্টাল (Farmer)",
    badge: "Phase 5",
    icon: Sprout
  },
  {
    key: "netzero_simulator",
    label: "Net-Zero Simulator",
    badge: "SBTi 1.5°C",
    icon: Target
  },
  {
    key: "ledger",
    label: "SHA-256 Ledger",
    badge: "Article 6",
    icon: Hash
  },
  {
    key: "digital_twin",
    label: "3D Digital Twin",
    badge: "Phase 6",
    icon: Activity
  },
  {
    key: "copilot",
    label: "Scientific Copilot",
    badge: "Phase 4",
    icon: Sparkles
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("command_center");

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top-Level Navigation Bar with Framer Motion Tabs */}
      <div className="glass-card p-1.5 border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? "text-black font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                {/* Active Tab Background Pill Animation */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/25"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-black/20 text-black font-bold"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Network Pill Indicator */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#060D0A] border border-emerald-500/15 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">FastAPI ML Cluster:</span>
          <span className="text-emerald-400 font-bold">ACTIVE</span>
        </div>
      </div>

      {/* Main Tab Content View with Page Transition */}
      <main className="min-h-[550px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "command_center" && <CommandCenterView />}
            {activeTab === "geo_map" && <GeoAnalyticsView />}
            {activeTab === "farmer_portal" && <FarmerPortalView />}
            {activeTab === "netzero_simulator" && <NetZeroSimulator />}
            {activeTab === "ledger" && <LedgerView />}
            {activeTab === "digital_twin" && <DigitalTwinViewer />}
            {activeTab === "copilot" && <CopilotPanel />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
