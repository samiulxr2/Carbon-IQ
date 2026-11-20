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

  let colorClass = "bg-[#0D1914] text-cyan-400 border-cyan-500/50";
  let badgeColor = "bg-cyan-500";
  let categorySvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>';

  if (isTampered) {
    colorClass = "bg-red-950 text-red-400 border-red-500/80";
    badgeColor = "bg-red-500";
    categorySvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  } else if (stock >= 140) {
    colorClass = "bg-[#0D1914] text-emerald-400 border-emerald-500/60";
    badgeColor = "bg-emerald-500";
    categorySvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>';
  } else if (stock < 90) {
    colorClass = "bg-[#0D1914] text-amber-400 border-amber-500/60";
    badgeColor = "bg-amber-500";
    categorySvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3"/></svg>';
  }

  const selectedRing = isSelected
    ? "ring-2 ring-emerald-400 scale-105"
    : "hover:scale-102";

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${selectedRing}">
      <!-- Beacon Indicator (Only pulses if tampered) -->
      <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        ${isTampered ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>' : ''}
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${badgeColor}"></span>
      </span>

      <!-- Main Pin Badge -->
      <div class="px-2 py-1 rounded-[6px] border flex items-center gap-1.5 shadow-md ${colorClass}">
        <span class="shrink-0 flex items-center justify-center">${categorySvg}</span>
        <div class="flex flex-col text-left">
          <span class="text-[9px] font-mono font-semibold leading-tight uppercase tracking-wider">${node.id}</span>
          <span class="text-[10px] font-mono font-medium leading-none text-white">${stock.toFixed(1)} <span class="text-[8px] text-slate-400">t/ha</span></span>
        </div>
      </div>

      <!-- Stem Pointer -->
      <div class="w-1 h-1.5 ${badgeColor} -mt-0.5 rounded-b-sm opacity-80"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-leaflet-pin",
    html: html,
    iconSize: [80, 44],
    iconAnchor: [40, 42],
    popupAnchor: [0, -40]
  });
}

export default function BangladeshLeafletMap({
  nodes,
  selectedNodeId,
  onSelectNode
}: BangladeshLeafletMapProps) {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[520px] rounded-[8px] overflow-hidden border border-emerald-500/20 glass-card">
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
                    <span className="font-mono font-semibold text-emerald-400">{node.id}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-medium ${
                        node.trust_score >= 95
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
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
                      <span className="text-emerald-400 font-semibold">{node.current_carbon_stock?.toFixed(1) || "0.0"} t/ha</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Trust: </span>
                      <span className={node.trust_score >= 95 ? "text-cyan-400 font-semibold" : "text-red-400 font-semibold"}>
                        {node.trust_score?.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectNode(node.id)}
                    className="btn-primary w-full mt-2 py-1 px-2 text-[10px] font-mono"
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
      <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-[6px] bg-[#060D0A]/95 border border-slate-800 text-[10px] font-mono space-y-1 pointer-events-auto">
        <div className="text-slate-300 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Carbon Stock & Status Key</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-300">High Blue Carbon (&gt;= 140 t/ha)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="text-slate-300">Coastal Wetland (90-139 t/ha)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-300">Agroforestry (&lt; 90 t/ha)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-400 font-medium">Sensor Fraud / Spoofed (&lt; 95%)</span>
        </div>
      </div>
    </div>
  );
}
