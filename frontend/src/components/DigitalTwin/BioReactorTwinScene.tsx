"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface BioReactorTwinSceneProps {
  isTampered: boolean;
  selectedSensor: string;
  onSelectSensor: (sensorId: string) => void;
  ledIntensity: number; // 0.0 to 1.0
  coolingTemp: number; // 18.0 to 34.0 °C
  pumpSpeed: number; // 0.1 to 1.0
}

interface BubbleParticle {
  x: number;
  y: number;
  z: number;
  speed: number;
  scale: number;
}

export default function BioReactorTwinScene({
  isTampered,
  selectedSensor,
  onSelectSensor,
  ledIntensity,
  coolingTemp,
  pumpSpeed
}: BioReactorTwinSceneProps) {
  const beaconRef = useRef<THREE.Mesh>(null);
  const bubblesGroupRef = useRef<THREE.Group>(null);

  // Generate 32 bubble particle initial positions
  const bubbles: BubbleParticle[] = useMemo(() => {
    return Array.from({ length: 32 }, () => ({
      x: (Math.random() - 0.5) * 1.6,
      y: Math.random() * 2.8 - 1.4,
      z: (Math.random() - 0.5) * 1.6,
      speed: 0.015 + Math.random() * 0.025,
      scale: 0.04 + Math.random() * 0.05
    }));
  }, []);

  // Animate rising bubbles and pulsing beacon
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Beacon pulse
    if (beaconRef.current) {
      const pulseSpeed = isTampered ? 8.0 : 3.0;
      const s = 1.0 + 0.25 * Math.sin(t * pulseSpeed);
      beaconRef.current.scale.set(s, s, s);
    }

    // Animate bubble particles
    if (bubblesGroupRef.current) {
      bubblesGroupRef.current.children.forEach((child, i) => {
        const b = bubbles[i];
        if (b) {
          child.position.y += b.speed * (0.5 + pumpSpeed * 1.5);
          // Loop back to bottom when reaching surface
          if (child.position.y > 1.4) {
            child.position.y = -1.4;
          }
          // Subtle horizontal jitter
          child.position.x = b.x + Math.sin(t * 3.0 + i) * 0.03;
        }
      });
    }
  });

  const beaconColor = isTampered ? "#EF4444" : "#10B981";

  // Cooling unit color feedback (cold cyan vs warm amber)
  const chillerColor = coolingTemp < 24 ? "#06B6D4" : coolingTemp < 29 ? "#10B981" : "#F59E0B";

  return (
    <group position={[0, -0.3, 0]}>
      {/* ============================================================== */}
      {/* 1. STRUCTURAL BASE PLATFORM & MOUNTING FRAME */}
      {/* ============================================================== */}
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[1.7, 1.85, 0.4, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Frame Uprights (Stainless Steel Support Rods) */}
      {[-1.3, 1.3].map((x, xi) =>
        [-1.3, 1.3].map((z, zi) => (
          <mesh key={`${xi}-${zi}`} position={[x, 0.1, z]}>
            <cylinderGeometry args={[0.04, 0.04, 3.4, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
        ))
      )}

      {/* Top Cap Enclosure */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[1.65, 1.65, 0.3, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ============================================================== */}
      {/* 2. GLASS PHOTOBIOREACTOR TANK (Translucent & Refractive) */}
      {/* ============================================================== */}
      <mesh
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("reactor_core");
        }}
      >
        <cylinderGeometry args={[1.35, 1.35, 3.1, 32]} />
        <meshPhysicalMaterial
          color="#a7f3d0"
          transparent
          opacity={0.32}
          roughness={0.08}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>

      {/* Microalgal Liquid Culture (Chlorella vulgaris green fluid) */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.28, 1.28, 2.9, 32]} />
        <meshStandardMaterial
          color="#059669"
          transparent
          opacity={0.65}
          roughness={0.2}
          emissive="#047857"
          emissiveIntensity={0.15 + ledIntensity * 0.25}
        />
      </mesh>

      {/* ============================================================== */}
      {/* 3. DYNAMIC MICROALGAE BUBBLES GROUP */}
      {/* ============================================================== */}
      <group ref={bubblesGroupRef}>
        {bubbles.map((b, idx) => (
          <mesh key={idx} position={[b.x, b.y, b.z]}>
            <sphereGeometry args={[b.scale, 8, 8]} />
            <meshStandardMaterial
              color="#ecfdf5"
              transparent
              opacity={0.8}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 4. OVERHEAD ACTINIC LED GROW LIGHT ARRAY */}
      {/* ============================================================== */}
      <group position={[0, 1.95, 0]}>
        <mesh>
          <cylinderGeometry args={[1.4, 1.4, 0.1, 16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Glow panels */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.02, 16]} />
          <meshStandardMaterial
            color="#d946ef"
            emissive="#d946ef"
            emissiveIntensity={ledIntensity * 3.2}
          />
        </mesh>
        <pointLight
          position={[0, -0.3, 0]}
          color="#d946ef"
          intensity={ledIntensity * 3.5}
          distance={4.5}
        />
      </group>

      {/* ============================================================== */}
      {/* 5. COOLING UNIT & HEAT EXCHANGER COIL */}
      {/* ============================================================== */}
      <group
        position={[1.9, -0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("chiller_unit");
        }}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.7, 1.4, 0.8]} />
          <meshStandardMaterial
            color={selectedSensor === "chiller_unit" ? "#38bdf8" : "#1e293b"}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* Radiator Grill */}
        <mesh position={[0.36, 0.2, 0]}>
          <boxGeometry args={[0.04, 0.8, 0.6]} />
          <meshStandardMaterial color={chillerColor} emissive={chillerColor} emissiveIntensity={0.6} />
        </mesh>
        <Html position={[0, 0.9, 0]} center distanceFactor={8}>
          <div className="px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-[10px] font-mono text-cyan-300 pointer-events-none whitespace-nowrap shadow-md">
            Chiller ({coolingTemp.toFixed(1)}°C)
          </div>
        </Html>
      </group>

      {/* ============================================================== */}
      {/* 6. SENSOR MODULE PROBES */}
      {/* ============================================================== */}
      {/* Sensor 1: Optical Turbidity / Biomass Optical Density Sensor */}
      <group
        position={[-1.45, 0.2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("turbidity_probe");
        }}
      >
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.45, 8]} />
          <meshStandardMaterial
            color={selectedSensor === "turbidity_probe" ? "#10B981" : "#64748B"}
            metalness={0.8}
          />
        </mesh>
        <mesh position={[-0.25, 0, 0]}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color="#065f46" />
        </mesh>
        <Html position={[-0.45, 0, 0]} center distanceFactor={8}>
          <div className="px-2 py-0.5 rounded bg-black/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 pointer-events-none whitespace-nowrap shadow-md">
            Turbidity (NTU)
          </div>
        </Html>
      </group>

      {/* Sensor 2: Dissolved Gas Sensor (CO2 / O2 / CH4 Exhaust Manifold) */}
      <group
        position={[0, 2.1, 0.6]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("gas_probe");
        }}
      >
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshStandardMaterial
            color={selectedSensor === "gas_probe" ? "#06B6D4" : "#475569"}
            metalness={0.8}
          />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#06B6D4" />
        </mesh>
        <Html position={[0, 0.45, 0]} center distanceFactor={8}>
          <div className="px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 pointer-events-none whitespace-nowrap shadow-md">
            Gas Sensor (CO2 / O2)
          </div>
        </Html>
      </group>

      {/* Top Beacon (Tamper Alert Indicator) */}
      <group
        position={[0, 2.25, -0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSensor("chamber_beacon");
        }}
      >
        <mesh ref={beaconRef}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial
            color={beaconColor}
            emissive={beaconColor}
            emissiveIntensity={isTampered ? 2.8 : 1.2}
          />
        </mesh>
        <pointLight
          color={beaconColor}
          intensity={isTampered ? 2.5 : 1.0}
          distance={4}
        />
        <Html position={[0, 0.35, 0]} center distanceFactor={7}>
          <div
            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase shadow-lg pointer-events-none whitespace-nowrap ${
              isTampered
                ? "bg-red-950/90 border-red-500 text-red-300 animate-pulse"
                : "bg-emerald-950/90 border-emerald-500 text-emerald-300"
            }`}
          >
            {isTampered ? "⚠️ BIO-BEACON: TAMPERED" : "NODE-BD-06 BEACON"}
          </div>
        </Html>
      </group>
    </group>
  );
}
