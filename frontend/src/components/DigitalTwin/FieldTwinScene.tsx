"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface FieldTwinSceneProps {
  isTampered: boolean;
  selectedSensor: string;
  onSelectSensor: (sensorId: string) => void;
  tidalLevel: number; // 0 to 1
  solarIntensity: number; // 0 to 1
}

export default function FieldTwinScene({
  isTampered,
  selectedSensor,
  onSelectSensor,
  tidalLevel,
  solarIntensity
}: FieldTwinSceneProps) {
  const beaconRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  // Animate beacon pulse & water subtle wave
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (beaconRef.current) {
      const pulseSpeed = isTampered ? 8.0 : 3.0;
      const scale = 1.0 + 0.25 * Math.sin(t * pulseSpeed);
      beaconRef.current.scale.set(scale, scale, scale);
    }

    if (waterRef.current) {
      waterRef.current.position.y = -0.1 + 0.05 * Math.sin(t * 1.5) + (tidalLevel - 0.5) * 0.3;
    }
  });

  const beaconColor = isTampered ? "#EF4444" : "#10B981";

  return (
    <group position={[0, -0.5, 0]}>
      {/* Sunlight illumination based on solar slider */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.6 + solarIntensity * 0.9}
        color={solarIntensity > 0.7 ? "#fff7ed" : "#e0f2fe"}
        castShadow
      />

      {/* ============================================================== */}
      {/* 1. SOIL GEOLOGICAL LAYERS (Cross-Section) */}
      {/* ============================================================== */}
      {/* Deep Subsoil Bedrock Layer */}
      <mesh position={[0, -1.8, 0]}>
        <boxGeometry args={[6.4, 0.8, 5.4]} />
        <meshStandardMaterial color="#1a120c" roughness={0.9} />
      </mesh>

      {/* Anaerobic Peat & Root Zone Layer (Deep Carbon Storage) */}
      <mesh
        position={[0, -1.0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("peat_layer");
        }}
      >
        <boxGeometry args={[6.4, 0.8, 5.4]} />
        <meshStandardMaterial
          color={selectedSensor === "peat_layer" ? "#442e1d" : "#2b1f14"}
          roughness={0.85}
        />
      </mesh>

      {/* Surface Silt / Intertidal Mudbank (Left Side) */}
      <mesh position={[-1.0, -0.3, 0]}>
        <boxGeometry args={[4.4, 0.6, 5.4]} />
        <meshStandardMaterial color="#3d2b1d" roughness={0.8} />
      </mesh>

      {/* ============================================================== */}
      {/* 2. TIDAL WATER CROSS-SECTION */}
      {/* ============================================================== */}
      <mesh ref={waterRef} position={[2.2, -0.1, 0]}>
        <boxGeometry args={[2.0, 0.8, 5.4]} />
        <meshStandardMaterial
          color="#06B6D4"
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* ============================================================== */}
      {/* 3. MANGROVE ECOSYSTEM (Avicennia / Rhizophora) */}
      {/* ============================================================== */}
      <group position={[-1.2, 0, -0.4]}>
        {/* Main Trunk */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.22, 0.32, 2.2, 8]} />
          <meshStandardMaterial color="#332014" roughness={0.9} />
        </mesh>

        {/* Stilt Roots (Arching into Mud and Water) */}
        <mesh position={[0.4, 0.2, 0.3]} rotation={[0.4, 0, -0.6]}>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
          <meshStandardMaterial color="#2d1c12" />
        </mesh>
        <mesh position={[-0.4, 0.2, 0.2]} rotation={[0.3, 0, 0.6]}>
          <cylinderGeometry args={[0.08, 0.08, 1.1, 6]} />
          <meshStandardMaterial color="#2d1c12" />
        </mesh>
        <mesh position={[0.2, 0.2, -0.4]} rotation={[-0.5, 0, -0.4]}>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
          <meshStandardMaterial color="#2d1c12" />
        </mesh>
        <mesh position={[0.7, -0.1, 0.6]} rotation={[0.2, 0, -0.8]}>
          <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
          <meshStandardMaterial color="#2d1c12" />
        </mesh>

        {/* Foliage Canopy Spheres */}
        <mesh position={[0, 2.3, 0]}>
          <sphereGeometry args={[0.95, 12, 12]} />
          <meshStandardMaterial color="#10B981" roughness={0.6} />
        </mesh>
        <mesh position={[-0.6, 2.1, 0.3]}>
          <sphereGeometry args={[0.75, 10, 10]} />
          <meshStandardMaterial color="#059669" roughness={0.6} />
        </mesh>
        <mesh position={[0.6, 2.2, -0.2]}>
          <sphereGeometry args={[0.7, 10, 10]} />
          <meshStandardMaterial color="#34D399" roughness={0.6} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 4. SENSOR NODES & TELEMETRY BEACON */}
      {/* ============================================================== */}
      {/* Node 1: Capacitive Soil Moisture & Salinity Probe (Embedded in Peat) */}
      <group
        position={[-0.3, -0.6, 0.8]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("probe_moisture");
        }}
      >
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
          <meshStandardMaterial
            color={selectedSensor === "probe_moisture" ? "#06B6D4" : "#64748B"}
            metalness={0.7}
          />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.18, 0.12, 0.12]} />
          <meshStandardMaterial color="#0D1914" />
        </mesh>
        <Html position={[0, 0.65, 0]} center distanceFactor={8}>
          <div className="px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 pointer-events-none whitespace-nowrap shadow-md">
            Soil Probe (EC / Moist)
          </div>
        </Html>
      </group>

      {/* Node 2: Soil Temperature & Microbe Oxidation Sensor (Root Zone) */}
      <group
        position={[-2.2, -0.8, -0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("probe_temp");
        }}
      >
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshStandardMaterial
            color={selectedSensor === "probe_temp" ? "#F59E0B" : "#64748B"}
            metalness={0.8}
          />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#F59E0B" />
        </mesh>
        <Html position={[0, 0.55, 0]} center distanceFactor={8}>
          <div className="px-2 py-0.5 rounded bg-black/80 border border-amber-500/40 text-[10px] font-mono text-amber-300 pointer-events-none whitespace-nowrap shadow-md">
            Thermal Probe (°C)
          </div>
        </Html>
      </group>

      {/* Node 3: Telemetry Tower Mast & Pulsing Satellite Beacon */}
      <group
        position={[0.8, 0, 1.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("telemetry_tower");
        }}
      >
        {/* Tower Base & Mast */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.06, 0.12, 1.4, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Solar Cell Panel on Tower */}
        <mesh position={[0.15, 1.2, 0]} rotation={[0.4, 0, 0.3]}>
          <boxGeometry args={[0.35, 0.02, 0.25]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Pulsing Beacon Light */}
        <mesh ref={beaconRef} position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial
            color={beaconColor}
            emissive={beaconColor}
            emissiveIntensity={isTampered ? 2.5 : 1.2}
          />
        </mesh>

        {/* Beacon Point Light */}
        <pointLight
          position={[0, 1.5, 0]}
          color={beaconColor}
          intensity={isTampered ? 2.5 : 1.0}
          distance={4}
        />

        <Html position={[0, 1.75, 0]} center distanceFactor={7}>
          <div
            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase shadow-lg pointer-events-none whitespace-nowrap ${
              isTampered
                ? "bg-red-950/90 border-red-500 text-red-300 animate-pulse"
                : "bg-emerald-950/90 border-emerald-500 text-emerald-300"
            }`}
          >
            {isTampered ? "ALERT: SENSOR TAMPERED" : "NODE-BD-01 BEACON"}
          </div>
        </Html>
      </group>
    </group>
  );
}
