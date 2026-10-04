"use client";

import React from "react";

/**
 * CoachMaster Modern Light-Themed Logo
 * Designed specifically for sports & karate academies.
 * Uses the platform's primary color palette: vibrant red, rose, soft light gradients, and crisp white.
 */
export default function CoachMasterLogo({ size = "default", className = "" }) {
  // Size presets
  const sizeMap = {
    sm: "h-8 w-8 min-w-8",
    default: "h-9 w-9 min-w-9 sm:h-9.5 sm:w-9.5 sm:min-w-9.5",
    lg: "h-11 w-11 min-w-11",
    xl: "h-14 w-14 min-w-14",
  };

  const chosenSize = sizeMap[size] || sizeMap.default;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl border border-red-200/90 bg-gradient-to-br from-white via-red-50/70 to-rose-100/60 p-1 shadow-xs shadow-red-500/10 ring-1 ring-red-100/80 select-none ${chosenSize} ${className}`}
      aria-label="CoachMaster Logo"
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-2xs"
      >
        <defs>
          {/* Primary Athletic Red Gradient */}
          <linearGradient id="cmlRed" x1="10" y1="10" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          {/* Golden Champion Star Gradient */}
          <linearGradient id="cmlGold" x1="31" y1="5" x2="38" y2="13" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Soft inner glow */}
          <filter id="cmlGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="0.8" stdDeviation="0.6" floodColor="#DC2626" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Dynamic Motion Energy Arc (speed trails) */}
        <path
          d="M 9 32 C 14 36.5, 27 36, 33 26.5 C 35.5 22.5, 35 16, 32.5 12"
          stroke="url(#cmlRed)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="2 2.5"
          opacity="0.35"
        />
        <path
          d="M 11 30 C 16.5 35, 27 34, 32 24.5"
          stroke="url(#cmlRed)"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Martial Arts Champion Head */}
        <circle cx="17.5" cy="11.5" r="2.8" fill="url(#cmlRed)" filter="url(#cmlGlow)" />

        {/* Karateka Dynamic High-Kick Silhouette */}
        <path
          d="M 16.5 15
             C 18 15, 20.5 16, 22 17.5
             L 25 17
             L 26 18.5
             L 22.5 19.5
             L 22 22
             L 27 18
             L 34 11
             L 35.5 12.5
             L 28.5 20.5
             L 23 24.5
             L 21.5 24.5
             L 19.5 32.5
             L 16.8 32.5
             L 18 25
             L 14 26
             L 13 24.5
             L 16 21
             C 15 19, 14.5 17, 16.5 15 Z"
          fill="url(#cmlRed)"
          filter="url(#cmlGlow)"
        />

        {/* Martial Arts Belt Knot & Tails */}
        <path
          d="M 19 24.5 Q 17 27 14.5 28.5 M 19.5 24.5 Q 20.5 28 21.5 29.5"
          stroke="#0F172A"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Golden Championship Star */}
        <path
          d="M 34.5 6 L 35.3 8.2 L 37.5 9 L 35.3 9.8 L 34.5 12 L 33.7 9.8 L 31.5 9 L 33.7 8.2 Z"
          fill="url(#cmlGold)"
        />
      </svg>
    </div>
  );
}
