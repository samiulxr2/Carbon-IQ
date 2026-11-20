"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import FieldTwinScene from "./FieldTwinScene";
import BioReactorTwinScene from "./BioReactorTwinScene";

interface DigitalTwinCanvasProps {
  sceneType: "field" | "bioreactor";
  isTampered: boolean;
  selectedSensor: string;
  onSelectSensor: (sensorId: string) => void;
  // Field controls
  tidalLevel: number;
  solarIntensity: number;
  // Bio-reactor controls
  ledIntensity: number;
  coolingTemp: number;
  pumpSpeed: number;
}

export default function DigitalTwinCanvas({
  sceneType,
  isTampered,
  selectedSensor,
  onSelectSensor,
  tidalLevel,
  solarIntensity,
  ledIntensity,
  coolingTemp,
  pumpSpeed
}: DigitalTwinCanvasProps) {
  return (
    <div className="w-full h-[360px] sm:h-[400px] lg:h-[420px] rounded-[8px] overflow-hidden bg-[#0A1410] border border-emerald-500/20 relative">
      <Canvas
        camera={{ position: [4.5, 3.2, 5.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[-5, 5, -5]} intensity={0.3} color="#06B6D4" />

        <Suspense fallback={null}>
          {sceneType === "field" ? (
            <FieldTwinScene
              isTampered={isTampered}
              selectedSensor={selectedSensor}
              onSelectSensor={onSelectSensor}
              tidalLevel={tidalLevel}
              solarIntensity={solarIntensity}
            />
          ) : (
            <BioReactorTwinScene
              isTampered={isTampered}
              selectedSensor={selectedSensor}
              onSelectSensor={onSelectSensor}
              ledIntensity={ledIntensity}
              coolingTemp={coolingTemp}
              pumpSpeed={pumpSpeed}
            />
          )}

          <ContactShadows
            position={[0, -2.2, 0]}
            opacity={0.65}
            scale={10}
            blur={2.0}
            far={4.0}
          />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={3.5}
          maxDistance={11.0}
          maxPolarAngle={Math.PI / 2 + 0.05}
        />
      </Canvas>
    </div>
  );
}
