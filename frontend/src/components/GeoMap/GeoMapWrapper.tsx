"use client";

import React from "react";
import dynamic from "next/dynamic";
import { GeoNodeData } from "./BangladeshLeafletMap";
import { Loader2 } from "lucide-react";

const BangladeshLeafletMap = dynamic(
  () => import("./BangladeshLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl border border-emerald-500/20 glass-card flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading Bangladesh OpenStreetMap Tiles...</span>
      </div>
    )
  }
);

interface GeoMapWrapperProps {
  nodes: GeoNodeData[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export default function GeoMapWrapper(props: GeoMapWrapperProps) {
  return <BangladeshLeafletMap {...props} />;
}
