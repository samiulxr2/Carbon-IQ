import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  iconOnly?: boolean;
}

export default function Logo({
  className = "",
  size = 28,
  iconOnly = false
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Geometric Hexagon + Leaf + Circuit Node Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Hexagonal container */}
        <polygon
          points="16,2.5 28.5,9.5 28.5,23.5 16,30.5 3.5,23.5 3.5,9.5"
          stroke="#10B981"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#0D1914"
        />
        {/* Stylized leaf contour */}
        <path
          d="M16 8 C11.5 12.5, 11 18, 16 23 C21 18, 20.5 12.5, 16 8 Z"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Central telemetry node / circuit dot */}
        <circle cx="16" cy="15.5" r="1.75" fill="#10B981" />
        <line
          x1="16"
          y1="17.25"
          x2="16"
          y2="23"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span className="font-bold text-base tracking-tight text-white flex items-baseline">
          CarbonIQ
          <span className="text-emerald-400 font-normal text-xs ml-1 tracking-wider uppercase">
            MRV
          </span>
        </span>
      )}
    </div>
  );
}
