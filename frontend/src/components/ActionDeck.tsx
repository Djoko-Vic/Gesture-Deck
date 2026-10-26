"use client";

import React from "react";
import { ActionEvent, MediaTarget } from "../lib/types";

interface ActionDeckProps {
  onTriggerAction: (action: string, params?: Record<string, any>) => void;
  activeProfile: string;
  targetProfile: string;
  selectedTargetId?: string;
  availableTargets?: MediaTarget[];
  mediaDetectionEnabled: boolean;
  onSelectTarget?: (targetId: string) => void;
  onSelectTargetProfile?: (profile: string) => void;
  onToggleMediaDetection: (enabled: boolean) => void;
  windowTitle: string;
  recentEvents: ActionEvent[];
  cameraActive?: boolean;
  cameraRequested?: boolean;
  onToggleCamera?: (requested: boolean) => void;
  pinchSeekSeconds?: number;
  onUpdatePinchSeekSeconds?: (sec: number) => void;
}

export const ActionDeck: React.FC<ActionDeckProps> = ({
  onTriggerAction,
  activeProfile,
  targetProfile,
  selectedTargetId = "auto",
  availableTargets = [],
  mediaDetectionEnabled,
  onSelectTarget,
  onSelectTargetProfile,
  onToggleMediaDetection,
  windowTitle,
  recentEvents,
  cameraActive = false,
  cameraRequested = false,
  onToggleCamera,
  pinchSeekSeconds = 10,
  onUpdatePinchSeekSeconds,
}) => {
  const [localSeekStep, setLocalSeekStep] = React.useState<number>(pinchSeekSeconds);

  React.useEffect(() => {
    if (pinchSeekSeconds) {
      setLocalSeekStep(pinchSeekSeconds);
    }
  }, [pinchSeekSeconds]);

  const handleSeekStepChange = (val: number) => {
    setLocalSeekStep(val);
    if (onUpdatePinchSeekSeconds) {
      onUpdatePinchSeekSeconds(val);
    }
  };

  const currentTargetId = selectedTargetId || targetProfile || "auto";

  const handleTargetChange = (targetId: string) => {
    if (onSelectTarget) {
      onSelectTarget(targetId);
    } else if (onSelectTargetProfile) {
      onSelectTargetProfile(targetId);
    }
  };

  // Separate detected MPRIS players from default presets
  const mprisTargets = availableTargets.filter((t) => t.type === "mpris");

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* =========================================================================
          PANEL 1: TARGET SITE & ACTIVE MEDIA STREAM SELECTION
          ========================================================================= */}
      <div className="border border-[var(--ink)] bg-[#0B0B0B] p-3.5 flex flex-col gap-3">
        {/* Row 1: Target Stream Selector with Real Media Names */}
        <div className="flex flex-col gap-2 border-b border-[var(--grey)]/25 pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#E5322B] inline-block" />
              <span className="text-[10px] uppercase tracking-wider text-[var(--grey)]">
                TARGET MEDIA / SITE:
              </span>
              <span className="font-bold uppercase text-[var(--ink)]">
                [{activeProfile}]
              </span>
            </div>

            {/* Camera Hardware On-Demand Indicator & Toggle */}
            {onToggleCamera && (
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 inline-block ${
                    cameraActive ? "bg-[#1E6B3E] animate-pulse" : "bg-[var(--grey)]"
                  }`}
                />
                <span className="text-[9px] uppercase text-[var(--grey)]">
                  CAM: {cameraActive ? "ON" : "STANDBY"}
                </span>
                <button
                  onClick={() => onToggleCamera(!cameraRequested)}
                  className={`text-[9px] px-2 py-0.5 border font-bold transition-none ${
                    cameraActive
                      ? "border-[#1E6B3E] text-[#1E6B3E] hover:bg-[#1E6B3E]/10"
                      : "border-[var(--grey)] text-[var(--grey)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                  }`}
                >
                  {cameraActive ? "[ PAUSE CAM ]" : "[ RESUME CAM ]"}
                </button>
              </div>
            )}
          </div>

          {/* Quick Choice Pills: AUTO, Detected Media Streams, and Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleTargetChange("auto")}
              className={`text-[9px] font-mono uppercase px-2.5 py-1 border transition-none ${
                currentTargetId === "auto"
                  ? "border-[#E5322B] bg-[#E5322B] text-[var(--paper)] font-bold"
                  : "border-[var(--grey)]/50 hover:border-[var(--ink)] text-[var(--grey)] hover:text-[var(--ink)]"
              }`}
            >
              AUTO
            </button>

            {/* Detected Media Players / Active Videos */}
            {mprisTargets.map((t) => {
              const isSelected = currentTargetId === t.id;
              const shortTitle = t.title.length > 28 ? t.title.slice(0, 26) + "…" : t.title;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTargetChange(t.id)}
                  title={`${t.label}: ${t.title} (${t.status || "ready"})`}
                  className={`text-[9px] font-mono uppercase px-2 py-1 border flex items-center gap-1 transition-none ${
                    isSelected
                      ? "border-[#E5322B] bg-[#E5322B] text-[var(--paper)] font-bold"
                      : "border-[#1E6B3E]/60 text-[#1E6B3E] hover:border-[#1E6B3E] hover:bg-[#1E6B3E]/10"
                  }`}
                >
                  <span className="w-1.5 h-1.5 bg-[#1E6B3E] inline-block" />
                  <span>{t.label}: {shortTitle}</span>
                </button>
              );
            })}

            {/* Presets */}
            {[
              { id: "youtube", label: "YOUTUBE" },
              { id: "spotify", label: "SPOTIFY" },
              { id: "generic", label: "SYSTEM MEDIA" },
            ].map((p) => {
              const isSelected = currentTargetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleTargetChange(p.id)}
                  className={`text-[9px] font-mono uppercase px-2 py-1 border transition-none ${
                    isSelected
                      ? "border-[#E5322B] bg-[#E5322B] text-[var(--paper)] font-bold"
                      : "border-[var(--grey)]/40 hover:border-[var(--ink)] text-[var(--grey)] hover:text-[var(--ink)]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Explicit Dropdown Menu for Detailed Stream Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
            <span className="text-[10px] uppercase text-[var(--grey)] whitespace-nowrap">
              ACTIVE STREAMS LIST:
            </span>
            <select
              value={currentTargetId}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="w-full sm:flex-1 bg-[#141414] text-[var(--ink)] border border-[var(--grey)]/40 px-2 py-1 text-[11px] font-mono focus:border-[#E5322B] outline-none"
            >
              <option value="auto">
                [AUTO] Follow Active Focused Window &amp; Default Player
              </option>

              {mprisTargets.length > 0 && (
                <optgroup label="DETECTED ACTIVE MEDIA SESSIONS">
                  {mprisTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      ▶ {t.label}: {t.title} ({t.status || "Ready"})
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="STANDARD CONTROLLER PROFILES">
                <option value="youtube">
                  YouTube (Browser Hotkeys: K, J, L, Space)
                </option>
                <option value="spotify">
                  Spotify (Local Client &amp; System Media Keys)
                </option>
                <option value="generic">
                  System Media (Global OS Hardware Media Keys)
                </option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Row 2: Live Video Info Inspection Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span
              className={`w-2 h-2 inline-block shrink-0 ${
                mediaDetectionEnabled ? "bg-[#1E6B3E] animate-pulse" : "bg-[var(--grey)]"
              }`}
            />
            <span className="text-[10px] uppercase text-[var(--grey)] whitespace-nowrap">
              LIVE MEDIA TITLE:
            </span>
            <span className="text-[11px] font-bold text-[var(--ink)] truncate max-w-sm sm:max-w-xl">
              {mediaDetectionEnabled ? windowTitle || "No Active Media Detected" : "INSPECTION STANDBY (SWITCH OFF)"}
            </span>
          </div>

          <button
            onClick={() => onToggleMediaDetection(!mediaDetectionEnabled)}
            className={`text-[9px] font-mono uppercase px-3 py-1 border font-bold shrink-0 ${
              mediaDetectionEnabled
                ? "border-[#1E6B3E] bg-[#1E6B3E]/15 text-[#1E6B3E]"
                : "border-[var(--grey)] text-[var(--grey)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
            }`}
          >
            {mediaDetectionEnabled ? "[ INSPECTION: ON ]" : "[ TURN ON SWITCH ]"}
          </button>
        </div>
      </div>


      {/* =========================================================================
          PANEL 2: MANUAL ACTION DISPATCH PAD (WITH UPDATED GESTURE ICONS)
          ========================================================================= */}
      <div className="border border-[var(--ink)] bg-[#0B0B0B] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[var(--grey)]/30 pb-2">
          <span className="text-[9px] uppercase tracking-widest text-[var(--grey)]">
            MANUAL ACTION DISPATCH PAD
          </span>
          <span className="text-[9px] text-[var(--grey)] uppercase">TEST OVERRIDE</span>
        </div>

        {/* Pinch & Grab Seek Step Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#121212] border border-[var(--ink)] text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-[#E5322B] font-bold">🤏 PINCH &amp; GRAB CONTROL:</span>
            <span className="text-[var(--grey)]">Choose seek amount (&plusmn;{localSeekStep}s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[5, 10, 15, 30, 60].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => handleSeekStepChange(step)}
                className={`px-2 py-0.5 text-[9px] font-bold border transition-all cursor-pointer ${
                  localSeekStep === step
                    ? "bg-[#E5322B] text-white border-[#E5322B]"
                    : "border-[var(--grey)]/40 text-[var(--grey)] hover:text-white"
                }`}
              >
                {step}S
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onTriggerAction("play_pause")}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1"
          >
            <span>PLAY / PAUSE</span>
            <span className="text-[8px] text-[var(--grey)]">INDEX UP (☝️)</span>
          </button>

          <button
            onClick={() => onTriggerAction("next")}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1"
          >
            <span>NEXT TRACK</span>
            <span className="text-[8px] text-[#E5322B] font-bold">PEACE SIGN (✌️)</span>
          </button>

          <button
            onClick={() => onTriggerAction("previous")}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1"
          >
            <span>PREV TRACK</span>
            <span className="text-[8px] text-[#E5322B] font-bold">3 FINGERS (✌️+💍)</span>
          </button>

          <button
            onClick={() => onTriggerAction("volume_up")}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1"
          >
            <span>VOLUME UP</span>
            <span className="text-[8px] text-[var(--grey)]">THUMBS UP</span>
          </button>

          <button
            onClick={() => onTriggerAction("volume_down")}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1"
          >
            <span>VOLUME DOWN</span>
            <span className="text-[8px] text-[var(--grey)]">THUMBS DOWN</span>
          </button>

          <button
            onClick={() => onTriggerAction("mute")}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1"
          >
            <span>TOGGLE MUTE</span>
            <span className="text-[8px] text-[var(--grey)]">SYS MUTE</span>
          </button>

          <button
            onClick={() => onTriggerAction("seek_backward", { delta_seconds: -localSeekStep })}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1 cursor-pointer"
          >
            <span>SEEK -{localSeekStep}S</span>
            <span className="text-[8px] text-[var(--grey)]">SCRUB L (🤏)</span>
          </button>

          <button
            onClick={() => onTriggerAction("seek_forward", { delta_seconds: localSeekStep })}
            className="btn-technical text-[10px] py-2.5 px-3 flex flex-col items-start gap-1 cursor-pointer"
          >
            <span>SEEK +{localSeekStep}S</span>
            <span className="text-[8px] text-[var(--grey)]">SCRUB R (🤏)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PANEL 3: ACTION EXECUTION LOG
          ========================================================================= */}
      <div className="border border-[var(--ink)] bg-[#0B0B0B] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[var(--grey)]/30 pb-2">
          <span className="text-[9px] uppercase tracking-widest text-[var(--grey)]">
            ACTION EXECUTION LOG // SPEC SHEET
          </span>
          <span className="text-[9px] text-[var(--grey)]">
            {recentEvents.length} RECORDS
          </span>
        </div>

        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
          {recentEvents.length === 0 ? (
            <div className="text-[10px] text-[var(--grey)] py-4 text-center">
              // NO DISPATCH EVENTS RECORDED YET
            </div>
          ) : (
            recentEvents.map((ev, idx) => {
              const timeStr = new Date(ev.timestamp * 1000).toLocaleTimeString();
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 border-b border-[var(--grey)]/10 text-[10px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#E5322B] font-bold">[{ev.action || ev.type}]</span>
                    <span className="text-[var(--grey)] truncate">
                      {ev.message || `State -> ${ev.state}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--grey)] text-[9px] shrink-0">
                    <span>{ev.profile || "system"}</span>
                    <span>{timeStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
