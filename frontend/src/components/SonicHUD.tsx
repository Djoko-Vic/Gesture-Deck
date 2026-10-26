"use client";

import React from "react";
import { TelemetryPacket } from "../lib/types";

interface SonicHUDProps {
  telemetry: TelemetryPacket | null;
  onToggleWake: (targetState: "ACTIVE" | "SLEEPING") => void;
  isBridgeConnected?: boolean;
  onOpenBridge?: () => void;
}

const GESTURE_LABELS: Record<string, { label: string; action: string }> = {
  play_pause: { label: "INDEX POINTING UP", action: "PLAY / PAUSE" },
  next: { label: "PEACE SIGN (✌️)", action: "NEXT TRACK" },
  previous: { label: "3 FINGERS UP (✌️+💍)", action: "PREVIOUS TRACK" },
  thumbs_up: { label: "THUMBS UP", action: "VOLUME UP (+6%)" },
  thumbs_down: { label: "THUMBS DOWN", action: "VOLUME DOWN (-6%)" },
  fist: { label: "CLOSED FIST (HOLD)", action: "STANDBY SLEEP" },
  pinch: { label: "PINCH & DRAG", action: "TIMELINE SEEK" },
  open_palm: { label: "OPEN PALM", action: "NEUTRAL (NO ACTION)" },
  peace_up: { label: "PEACE SIGN (✌️)", action: "NEXT TRACK" },
  none: { label: "IDLE / AWAITING POSE", action: "NONE" },
};

export const SonicHUD: React.FC<SonicHUDProps> = ({
  telemetry,
  onToggleWake,
  isBridgeConnected = false,
  onOpenBridge,
}) => {
  const wakeState = telemetry?.wake_state || "SLEEPING";
  const isActive = wakeState === "ACTIVE";
  const inGrace = telemetry?.in_grace_period ?? false;
  const clutch = telemetry?.clutch;
  const isClutchEngaged = clutch?.is_engaged ?? false;
  const clutchEnabled = clutch?.enabled ?? true;

  const activeGestureKey = telemetry?.active_gesture || "none";
  const gestureMeta = GESTURE_LABELS[activeGestureKey] || {
    label: activeGestureKey.toUpperCase(),
    action: "CUSTOM ML ACTION",
  };
  const confidence = telemetry?.confidence ?? 0;
  const timeoutRem = telemetry?.timeout_remaining ?? 0;
  const isScrubbing = telemetry?.scrub?.is_scrubbing ?? false;
  const scrubDelta = telemetry?.scrub?.delta_seconds ?? 0;

  // Segmented confidence bar (10 segments)
  const totalSegments = 10;
  const filledSegments = Math.round(confidence * totalSegments);

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Top Spec Block: 2x2 Grid for maximum clarity & zero overflow */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Wake State Indicator */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3 flex flex-col justify-between min-h-[88px]">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)] font-bold">
              01 // STATE
            </span>
            <button
              onClick={() => onToggleWake(isActive ? "SLEEPING" : "ACTIVE")}
              className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[#E5322B] text-[#E5322B] hover:bg-[#E5322B] hover:text-white"
                  : "border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-black"
              }`}
            >
              {isActive ? "[ SLEEP ]" : "[ WAKE ]"}
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 flex-shrink-0 ${
                  isActive ? "bg-[#E5322B] shadow-[0_0_8px_#E5322B]" : "bg-[var(--grey)]"
                }`}
              />
              <span
                className={`font-display-condensed text-xl tracking-tight font-bold ${
                  isActive ? "text-[#E5322B]" : "text-[var(--grey)]"
                }`}
              >
                {wakeState}
              </span>
            </div>
            <span className="text-[10px] text-[var(--grey)] block mt-1 tracking-wide">
              {isActive
                ? (inGrace ? "GRACE PERIOD ACTIVE" : `TIMEOUT: ${timeoutRem.toFixed(1)}S`)
                : "WAVE 👋 TO WAKE"}
            </span>
          </div>
        </div>

        {/* 2. Safety Clutch */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3 flex flex-col justify-between min-h-[88px]">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)] font-bold">
              02 // CLUTCH
            </span>
            <span
              className={`px-1.5 py-0.5 text-[9px] border font-bold tracking-wider whitespace-nowrap ${
                !clutchEnabled
                  ? "border-[var(--grey)] text-[var(--grey)]"
                  : isClutchEngaged
                  ? "border-[#1E6B3E] bg-[#1E6B3E]/20 text-[#1E6B3E]"
                  : "border-[#E5322B] text-[#E5322B] bg-[#E5322B]/10"
              }`}
            >
              {!clutchEnabled ? "BYPASS" : isClutchEngaged ? "ARMED" : "LOCKED"}
            </span>
          </div>
          <div>
            <span className="font-display-condensed text-base font-bold text-[var(--ink)] block tracking-tight">
              {clutch?.target_pose === "open_palm" ? "LEFT PALM OPEN" : "LEFT FIST"}
            </span>
            <span className="text-[10px] text-[var(--grey)] block mt-1 tracking-wide">
              {isClutchEngaged ? "COMMANDS ENABLED" : "SAFETY INTERLOCK ON"}
            </span>
          </div>
        </div>

        {/* 3. Scrub Status */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3 flex flex-col justify-between min-h-[88px]">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)] font-bold">
              03 // SCRUB
            </span>
            <span
              className={`px-1.5 py-0.5 text-[9px] border font-bold tracking-wider whitespace-nowrap ${
                isScrubbing
                  ? "border-[#06b6d4] bg-[#06b6d4]/20 text-[#06b6d4]"
                  : "border-[var(--grey)]/40 text-[var(--grey)]"
              }`}
            >
              {isScrubbing ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
          <div>
            <span className={`font-display-condensed text-base font-bold block tracking-tight ${isScrubbing ? "text-[#06b6d4]" : "text-[var(--ink)]"}`}>
              {isScrubbing ? `${scrubDelta > 0 ? "+" : ""}${scrubDelta.toFixed(1)}S` : "PINCH + DRAG"}
            </span>
            <span className="text-[10px] text-[var(--grey)] block mt-1 tracking-wide">
              {isScrubbing ? "RELEASE TO COMMIT" : "REQUIRES CLUTCH"}
            </span>
          </div>
        </div>

        {/* 4. YouTube Bridge Status */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3 flex flex-col justify-between min-h-[88px]">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)] font-bold">
              04 // BRIDGE
            </span>
            <span
              className={`px-1.5 py-0.5 text-[9px] border font-bold tracking-wider whitespace-nowrap ${
                isBridgeConnected
                  ? "border-[#1E6B3E] bg-[#1E6B3E]/20 text-[#1E6B3E]"
                  : "border-[#E5322B] text-[#E5322B] bg-[#E5322B]/10"
              }`}
            >
              {isBridgeConnected ? "ONLINE" : "STANDBY"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 flex-shrink-0 rounded-full ${
                  isBridgeConnected ? "bg-[#1E6B3E] shadow-[0_0_8px_#1E6B3E]" : "bg-[#E5322B]"
                }`}
              />
              <span className="font-display-condensed text-base font-bold text-[var(--ink)] tracking-tight">
                {isBridgeConnected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
            </div>
            {onOpenBridge ? (
              <button
                onClick={onOpenBridge}
                className="text-[10px] text-[#E5322B] hover:underline block mt-1 text-left font-bold tracking-wide"
              >
                {isBridgeConnected ? "[ VIEW STATUS ]" : "[ ⚡ CONNECT YOUTUBE ]"}
              </button>
            ) : (
              <span className="text-[10px] text-[var(--grey)] block mt-1">
                {isBridgeConnected ? "SITE VOL & SCRUB READY" : "BOOKMARKLET / EXT"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Spec Card: Detected Gesture & Live Telemetry Meters */}
      <div className="border border-[var(--ink)] bg-[#0B0B0B] p-4 flex flex-col gap-4">
        {/* Header: Recognized Pose & Target Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--grey)]/30 pb-3">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-[var(--grey)] block font-bold">
              RECOGNIZED POSE
            </span>
            <h3 className="font-display-condensed text-2xl text-[var(--ink)] tracking-tight mt-0.5 font-bold">
              {gestureMeta.label}
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[9px] uppercase tracking-widest text-[var(--grey)] block font-bold">
              TARGET ACTION
            </span>
            <span className="font-mono text-sm font-bold text-[#E5322B] block tracking-wide">
              {gestureMeta.action}
            </span>
          </div>
        </div>

        {/* Segmented Confidence Meter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-[var(--grey)] font-bold">
            <span>CONFIDENCE GATE // 75% MIN</span>
            <span className="text-[var(--ink)]">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="flex gap-1.5 h-3.5 w-full">
            {Array.from({ length: totalSegments }).map((_, i) => {
              const isFilled = i < filledSegments;
              const isOverGate = i >= 7; // >= 75%
              return (
                <div
                  key={i}
                  className={`flex-1 border border-[var(--grey)]/40 transition-colors duration-75 ${
                    isFilled
                      ? isOverGate
                        ? "bg-[#E5322B] shadow-[0_0_6px_#E5322B]"
                        : "bg-[var(--ink)]"
                      : "bg-white/[0.03]"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-[var(--grey)] tracking-wider">
            <span>0%</span>
            <span className="text-[var(--ink)] font-bold">THRESHOLD 75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Gesture Confirm Hold Progress (Charging Bar) */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--grey)]/20">
          <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
            <span className="text-[var(--grey)]">HOLD CONFIRMATION</span>
            <span className={`font-mono ${(telemetry?.confirm_progress ?? 0) >= 0.95 ? "text-[#1E6B3E]" : "text-[#E5322B]"}`}>
              {(telemetry?.confirm_progress ?? 0) >= 0.95 ? "✓ 100% CONFIRMED" : `${Math.round((telemetry?.confirm_progress ?? 0) * 100)}%`}
            </span>
          </div>
          <div className="w-full bg-white/[0.04] h-2.5 border border-[var(--grey)]/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                (telemetry?.confirm_progress ?? 0) >= 0.95
                  ? "bg-[#1E6B3E]"
                  : "bg-[#E5322B]"
              }`}
              style={{ width: `${Math.min(100, Math.round((telemetry?.confirm_progress ?? 0) * 100))}%` }}
            />
          </div>
        </div>

        {/* Live Pinch & Drag Status Gauge */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--grey)]/20 text-[10px] uppercase">
          <div className="flex items-center gap-2">
            <span className="text-[var(--grey)] font-bold">PINCH GRAB:</span>
            <span className={`px-1.5 py-0.5 font-bold border text-[9px] ${
              (telemetry?.is_pinch || telemetry?.pinch?.is_pinched)
                ? "border-[#E5322B] bg-[#E5322B] text-white"
                : "border-[var(--grey)] text-[var(--grey)]"
            }`}>
              {(telemetry?.is_pinch || telemetry?.pinch?.is_pinched) ? "GRABBED" : "OPEN"}
            </span>
          </div>
          <div className="font-mono text-[10px] text-[var(--grey)] text-right">
            GAP: <span className="text-[var(--ink)] font-bold">{(telemetry?.pinch_distance ?? telemetry?.pinch?.distance ?? 0.5).toFixed(2)}</span> / LIM: <span className="text-[#E5322B] font-bold">{(telemetry?.pinch?.pinch_on ?? 0.40).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
