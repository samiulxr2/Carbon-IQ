"use client";

import React, { useState, useRef, useEffect } from "react";
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

type TabKey =
  | "command_center"
  | "geo_map"
  | "farmer_portal"
  | "netzero_simulator"
  | "ledger"
  | "digital_twin"
  | "copilot";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: "command_center",
    label: "Command Center",
    icon: LayoutDashboard
  },
  {
    key: "geo_map",
    label: "Geo Analytics",
    icon: MapPin
  },
  {
    key: "farmer_portal",
    label: "Farmers",
    icon: Sprout
  },
  {
    key: "netzero_simulator",
    label: "Net-Zero",
    icon: Target
  },
  {
    key: "ledger",
    label: "Ledger",
    icon: Hash
  },
  {
    key: "digital_twin",
    label: "3D Twin",
    icon: Activity
  },
  {
    key: "copilot",
    label: "Copilot",
    icon: Sparkles
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("command_center");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-scroll active tab into view when selected on scrollable screens
  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <nav
        aria-label="Main Navigation"
        className="glass-card p-1.5 border-slate-800/80 relative overflow-hidden"
      >
        {/* Scrollable track below lg; evenly spaced 7-col grid on lg and up */}
        <div className="flex lg:grid lg:grid-cols-7 items-center gap-1.5 overflow-x-auto snap-x no-scrollbar py-0.5 w-full">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-2 px-3.5 rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap snap-center shrink-0 lg:shrink lg:w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${
                  isActive
                    ? "text-black font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-emerald-500 rounded-[6px]"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtle right fade gradient as scroll hint on mobile (< lg) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0D1914] to-transparent lg:hidden z-20"
        />
      </nav>

      {/* Main Tab Content View with Page Transition */}
      <div className="min-h-[550px] tab-content-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
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
      </div>
    </div>
  );
}
