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
      {/* Top Spec Block: Wake State, Safety Clutch, Scrub Status, YouTube Bridge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Wake State Indicator (Hard stepped ON/OFF) */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3.5 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)]">
              01 // STATE
            </span>
            <button
              onClick={() => onToggleWake(isActive ? "SLEEPING" : "ACTIVE")}
              className="btn-technical text-[10px] py-0.5 px-2"
            >
              {isActive ? "[ SLEEP ]" : "[ WAKE ]"}
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 ${
                  isActive ? "bg-[#E5322B]" : "bg-[var(--grey)]"
                }`}
              />
              <span
                className={`font-display-condensed text-xl tracking-tight ${
                  isActive ? "text-[#E5322B]" : "text-[var(--grey)]"
                }`}
              >
                {wakeState}
              </span>
            </div>
            {isActive && (
              <span className="text-[10px] text-[var(--grey)] block mt-0.5">
                {inGrace ? "GRACE PERIOD ACTIVE" : `IDLE TIMEOUT: ${timeoutRem.toFixed(1)}S`}
              </span>
            )}
          </div>
        </div>

        {/* 2. Safety Clutch */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3.5 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)]">
              02 // CLUTCH
            </span>
            <span
              className={`px-1.5 py-0.2 text-[9px] border font-bold ${
                !clutchEnabled
                  ? "border-[var(--grey)] text-[var(--grey)]"
                  : isClutchEngaged
                  ? "border-[#1E6B3E] bg-[#1E6B3E] text-[var(--paper)]"
                  : "border-[#E5322B] text-[#E5322B]"
              }`}
            >
              {!clutchEnabled ? "BYPASS" : isClutchEngaged ? "ARMED" : "LOCKED"}
            </span>
          </div>
          <div>
            <span className="font-display-condensed text-base text-[var(--ink)] block">
              {clutch?.target_pose === "open_palm" ? "LEFT PALM OPEN" : "LEFT FIST"}
            </span>
            <span className="text-[10px] text-[var(--grey)] block">
              {isClutchEngaged ? "COMMANDS ENABLED" : "SAFETY INTERLOCK ON"}
            </span>
          </div>
        </div>

        {/* 3. Scrub Status */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3.5 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)]">
              03 // SCRUB
            </span>
            <span
              className={`px-1.5 py-0.2 text-[9px] border font-bold ${
                isScrubbing
                  ? "border-[#E5322B] bg-[#E5322B] text-[var(--paper)]"
                  : "border-[var(--grey)] text-[var(--grey)]"
              }`}
            >
              {isScrubbing ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
          <div>
            <span className="font-display-condensed text-base text-[var(--ink)] block">
              {isScrubbing ? `${scrubDelta > 0 ? "+" : ""}${scrubDelta.toFixed(1)}S` : "PINCH + DRAG"}
            </span>
            <span className="text-[10px] text-[var(--grey)] block">
              {isScrubbing ? "RELEASE TO COMMIT" : "REQUIRES CLUTCH"}
            </span>
          </div>
        </div>

        {/* 4. YouTube Bridge Status */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3.5 flex flex-col justify-between min-h-[92px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--grey)]">
              04 // YT BRIDGE
            </span>
            <span
              className={`px-1.5 py-0.2 text-[9px] border font-bold ${
                isBridgeConnected
                  ? "border-[#1E6B3E] bg-[#1E6B3E] text-[var(--paper)]"
                  : "border-[#E5322B] text-[#E5322B]"
              }`}
            >
              {isBridgeConnected ? "ONLINE" : "STANDBY"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBridgeConnected ? "bg-[#1E6B3E]" : "bg-[#E5322B]"}`} />
              <span className="font-display-condensed text-base text-[var(--ink)] block truncate">
                {isBridgeConnected ? "DOM CONTROL" : "NOT CONNECTED"}
              </span>
            </div>
            {onOpenBridge ? (
              <button
                onClick={onOpenBridge}
                className="text-[10px] text-[#E5322B] hover:underline block mt-0.5 text-left font-bold"
              >
                {isBridgeConnected ? "[ VIEW STATUS ]" : "[ ⚡ CONNECT YOUTUBE ]"}
              </button>
            ) : (
              <span className="text-[10px] text-[var(--grey)] block mt-0.5">
                {isBridgeConnected ? "SITE VOL & SCRUB READY" : "BOOKMARKLET / EXT"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Spec Card: Detected Gesture & Segmented Confidence */}
      <div className="border border-[var(--ink)] bg-[#0B0B0B] p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--grey)]/30 pb-3">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-[var(--grey)] block">
              RECOGNIZED POSE
            </span>
            <h3 className="font-display-condensed text-2xl text-[var(--ink)] tracking-tight mt-0.5">
              {gestureMeta.label}
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[9px] uppercase tracking-widest text-[var(--grey)] block">
              TARGET ACTION
            </span>
            <span className="font-mono text-sm font-bold text-[#E5322B] block">
              {gestureMeta.action}
            </span>
          </div>
        </div>

        {/* Chunky Segmented Confidence Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] uppercase text-[var(--grey)]">
            <span>CONFIDENCE GATE // 75% MIN</span>
            <span className="text-[var(--ink)] font-bold">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="flex gap-1 h-3.5 w-full">
            {Array.from({ length: totalSegments }).map((_, i) => {
              const isFilled = i < filledSegments;
              const isOverGate = i >= 7; // >= 75%
              return (
                <div
                  key={i}
                  className={`flex-1 border border-[var(--grey)]/50 transition-colors duration-75 ${
                    isFilled
                      ? isOverGate
                        ? "bg-[#E5322B]"
                        : "bg-[var(--ink)]"
                      : "bg-transparent"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] text-[var(--grey)] tracking-wider">
            <span>0%</span>
            <span>THRESHOLD 75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Gesture Confirm Hold Progress (Charging Bar) */}
        {telemetry?.active_gesture && telemetry.active_gesture !== "neutral" && (
          <div className="flex flex-col gap-1 pt-2 border-t border-[var(--grey)]/20">
            <div className="flex justify-between text-[9px] uppercase tracking-wider">
              <span className="text-[var(--grey)]">HOLD CONFIRMATION</span>
              <span className={`font-bold ${(telemetry.confirm_progress ?? 0) >= 0.95 ? "text-[#1E6B3E]" : "text-[#E5322B]"}`}>
                {Math.round((telemetry.confirm_progress ?? 0) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[var(--ink)]/20 h-2 border border-[var(--grey)]/40 overflow-hidden">
              <div
                className="h-full bg-[#E5322B] transition-all duration-75"
                style={{ width: `${Math.min(100, Math.round((telemetry.confirm_progress ?? 0) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Pinch & Drag Status Gauge */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--grey)]/20 text-[9px] uppercase">
          <div className="flex items-center gap-2">
            <span className="text-[var(--grey)]">PINCH GRAB (EASY):</span>
            <span className={`px-1 py-0.2 font-bold border ${
              (telemetry?.is_pinch || telemetry?.pinch?.is_pinched)
                ? "border-[#E5322B] bg-[#E5322B] text-white"
                : "border-[var(--grey)] text-[var(--grey)]"
            }`}>
              {(telemetry?.is_pinch || telemetry?.pinch?.is_pinched) ? "GRABBED" : "OPEN"}
            </span>
          </div>
          <div className="font-mono text-[9px] text-[var(--grey)]">
            GAP: <span className="text-[var(--ink)] font-bold">{(telemetry?.pinch_distance ?? telemetry?.pinch?.distance ?? 0.5).toFixed(2)}</span> / THRESHOLD: <span className="text-[#E5322B] font-bold">{(telemetry?.pinch?.pinch_on ?? 0.40).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
