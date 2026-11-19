"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface GeoNodeData {
  id: string;
  name: string;
  node_type: string;
  ecosystem: string;
  lat: number;
  lon: number;
  area_ha: number;
  baseline_tco2e: number;
  current_carbon_stock: number;
  trust_score: number;
  status: string;
  latest_telemetry?: Record<string, any>;
}

interface BangladeshLeafletMapProps {
  nodes: GeoNodeData[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

// Helper to center the map when a node is selected
function MapRecenter({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.panTo([lat, lon], { animate: true, duration: 1.0 });
    }
  }, [lat, lon, map]);
  return null;
}

function createCustomPinIcon(node: GeoNodeData, isSelected: boolean) {
  const isTampered = node.trust_score < 95 || node.status === "TAMPERED" || node.status === "anomaly";
  const stock = node.current_carbon_stock || node.baseline_tco2e || 0;

  let colorClass = "bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-cyan-500/30";
  let badgeColor = "bg-cyan-500";
  let pulseColor = "bg-cyan-400";
  let categoryIcon = "💧";

  if (isTampered) {
    colorClass = "bg-red-500/25 text-red-400 border-red-500 shadow-red-500/50 animate-bounce";
    badgeColor = "bg-red-500";
    pulseColor = "bg-red-500";
    categoryIcon = "⚠️";
  } else if (stock >= 140) {
    colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-400 shadow-emerald-500/30";
    badgeColor = "bg-emerald-500";
    pulseColor = "bg-emerald-400";
    categoryIcon = "🌿";
  } else if (stock < 90) {
    colorClass = "bg-amber-500/20 text-amber-400 border-amber-400 shadow-amber-500/30";
    badgeColor = "bg-amber-500";
    pulseColor = "bg-amber-400";
    categoryIcon = "🌾";
  }

  const selectedRing = isSelected
    ? "ring-4 ring-white/60 scale-110"
    : "hover:scale-105";

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${selectedRing}">
      <!-- Pulsing Beacon -->
      <span class="absolute -top-1 -right-1 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 ${badgeColor}"></span>
      </span>

      <!-- Main Pin Badge -->
      <div class="px-2.5 py-1.5 rounded-lg border backdrop-blur-md shadow-lg flex items-center gap-1.5 ${colorClass}">
        <span class="text-xs">${categoryIcon}</span>
        <div class="flex flex-col text-left">
          <span class="text-[10px] font-mono font-bold leading-tight uppercase tracking-wider">${node.id}</span>
          <span class="text-[11px] font-mono font-bold leading-none text-white">${stock.toFixed(1)} <span class="text-[9px] text-slate-400">t/ha</span></span>
        </div>
      </div>

      <!-- Stem Pointer -->
      <div class="w-1.5 h-2 ${badgeColor} -mt-0.5 rounded-b-sm opacity-80"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-leaflet-pin",
    html: html,
    iconSize: [80, 48],
    iconAnchor: [40, 46],
    popupAnchor: [0, -42]
  });
}

export default function BangladeshLeafletMap({
  nodes,
  selectedNodeId,
  onSelectNode
}: BangladeshLeafletMapProps) {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-emerald-500/20 glass-card">
      <MapContainer
        center={[23.6850, 90.3563]}
        zoom={7}
        minZoom={6}
        maxZoom={12}
        scrollWheelZoom={false}
        className="w-full h-full dark-leaflet-tiles"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter lat={selectedNode?.lat} lon={selectedNode?.lon} />

        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const pinIcon = createCustomPinIcon(node, isSelected);

          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lon]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectNode(node.id)
              }}
            >
              <Popup>
                <div className="p-2 space-y-1.5 text-xs font-sans min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1">
                    <span className="font-mono font-bold text-emerald-400">{node.id}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        node.trust_score >= 95
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300 animate-pulse"
                      }`}
                    >
                      {node.trust_score >= 95 ? "Verified" : "Tampered"}
                    </span>
                  </div>

                  <p className="font-semibold text-white leading-tight">{node.name}</p>
                  <p className="text-slate-400 text-[10px]">{node.ecosystem}</p>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                    <div>
                      <span className="text-slate-400">Stock: </span>
                      <span className="text-emerald-400 font-bold">{node.current_carbon_stock?.toFixed(1) || "0.0"} t/ha</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Trust: </span>
                      <span className={node.trust_score >= 95 ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>
                        {node.trust_score?.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectNode(node.id)}
                    className="w-full mt-2 py-1 px-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-[10px] text-center transition-colors"
                  >
                    Inspect Telemetry
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-lg bg-[#060D0A]/90 border border-emerald-500/20 backdrop-blur-md shadow-xl text-[10px] font-mono space-y-1 pointer-events-auto">
        <div className="text-slate-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Carbon Stock & Trust Key</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-300">High Blue Carbon (≥140 t/ha)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span className="text-slate-300">Coastal Wetland (90–139 t/ha)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-300">Agroforestry (&lt;90 t/ha)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-bold">Sensor Fraud / Spoofed (&lt;95%)</span>
        </div>
      </div>
    </div>
  );
}
