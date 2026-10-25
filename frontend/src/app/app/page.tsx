"use client";

import React, { useState, useEffect } from "react";
import { useGestureWebSocket } from "../../hooks/useGestureWebSocket";
import { HandCanvas } from "../../components/HandCanvas";
import { SonicHUD } from "../../components/SonicHUD";
import { ActionDeck } from "../../components/ActionDeck";
import { Navbar } from "../../components/Navbar";
import { SettingsModal } from "../../components/SettingsModal";
import { GestureTrainerModal } from "../../components/GestureTrainerModal";
import { fetchStatus, setTargetProfileApi, setMediaDetectionApi, setTargetApi, setCameraStateApi } from "../../lib/api";
import { SystemStatus } from "../../lib/types";

export default function AppDashboardPage() {
  const {
    telemetry,
    isConnected,
    latencyMs,
    recentEvents,
    sendWakeState,
    sendAction,
    setTarget,
    setTargetProfile,
    setMediaDetection,
    setCamera,
    reconnect,
  } = useGestureWebSocket();

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchStatus();
        setSystemStatus(data);
      } catch (err) {
        // quiet
      }
    };
    loadStatus();
    const interval = setInterval(loadStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleManualAction = async (action: string, params?: Record<string, any>) => {
    sendAction(action, params);
  };

  const handleSelectTarget = async (targetId: string) => {
    setTarget(targetId);
    try {
      await setTargetApi(targetId);
      const updated = await fetchStatus();
      setSystemStatus(updated);
    } catch (e) {
      // quiet
    }
  };

  const handleSelectTargetProfile = async (profile: string) => {
    setTargetProfile(profile);
    try {
      await setTargetProfileApi(profile);
      const updated = await fetchStatus();
      setSystemStatus(updated);
    } catch (e) {
      // quiet
    }
  };

  const handleToggleMediaDetection = async (enabled: boolean) => {
    setMediaDetection(enabled);
    try {
      await setMediaDetectionApi(enabled);
      const updated = await fetchStatus();
      setSystemStatus(updated);
    } catch (e) {
      // quiet
    }
  };

  const handleToggleCamera = async (requested: boolean) => {
    setCamera(requested);
    try {
      await setCameraStateApi(requested);
      const updated = await fetchStatus();
      setSystemStatus(updated);
    } catch (e) {
      // quiet
    }
  };

  const hands = telemetry?.hands || [];
  const isPinch = telemetry?.is_pinch ?? false;
  const pinchDistance = telemetry?.pinch_distance ?? 1.0;
  const isScrubbing = telemetry?.scrub?.is_scrubbing ?? false;
  const scrubDelta = telemetry?.scrub?.delta_seconds ?? 0;
  const clutchEngaged = telemetry?.clutch?.is_engaged ?? false;
  const activeGesture = telemetry?.active_gesture ?? "none";
  const fps = telemetry?.fps ?? systemStatus?.fps ?? 0;
  const cameraType = telemetry?.camera_type ?? (systemStatus?.camera_active ? "webcam" : "synthetic_mock");

  return (
    <div className="theme-inverted min-h-screen bg-[#0B0B0B] text-[#E7E5E0] flex flex-col font-sans">
      <Navbar
        isConnected={isConnected}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTrainer={() => setIsTrainerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Top Technical Metadata Bar */}
        <div className="border border-[var(--ink)] bg-[#0B0B0B] p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] font-mono gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-[#E5322B] text-[var(--paper)] font-bold px-1.5 py-0.5">
              LIVE SKELETON
            </span>
            <span>SPEC: 21-JOINT DUAL HAND HUD</span>
            <span className="text-[var(--grey)]">// MIRRORED COORDINATE SPACE</span>
          </div>

          <div className="flex items-center gap-4 text-[var(--grey)]">
            <span>CALIBRATION: ACTIVE</span>
            <span>PRIVACY: LOCAL CPU ONLY</span>
          </div>
        </div>

        {/* Offline Warning if WebSocket Disconnected */}
        {!isConnected && (
          <div className="p-3 border-2 border-[#E5322B] bg-[#E5322B]/10 text-[#E5322B] font-mono text-xs flex items-center justify-between">
            <span>
              [ALERT] BACKEND TELEMETRY OFFLINE // WS://LOCALHOST:8000/WS UNREACHABLE
            </span>
            <button
              onClick={reconnect}
              className="btn-technical border-[#E5322B] text-[#E5322B] text-[10px] py-1 px-2.5"
            >
              RECONNECT
            </button>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Hand Skeleton Canvas & Action Deck (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <HandCanvas
              hands={hands}
              isPinch={isPinch}
              pinchDistance={pinchDistance}
              isScrubbing={isScrubbing}
              scrubDelta={scrubDelta}
              clutchEngaged={clutchEngaged}
              activeGesture={activeGesture}
              fps={fps}
              cameraType={cameraType}
            />

            <ActionDeck
              onTriggerAction={handleManualAction}
              activeProfile={telemetry?.context?.active_profile || systemStatus?.active_profile || "generic"}
              targetProfile={telemetry?.context?.target_profile || systemStatus?.target_profile || "auto"}
              selectedTargetId={telemetry?.context?.selected_target_id || systemStatus?.selected_target_id || "auto"}
              availableTargets={telemetry?.context?.available_targets || systemStatus?.available_targets || []}
              mediaDetectionEnabled={telemetry?.context?.media_detection_enabled ?? systemStatus?.media_detection_enabled ?? false}
              onSelectTarget={handleSelectTarget}
              onSelectTargetProfile={handleSelectTargetProfile}
              onToggleMediaDetection={handleToggleMediaDetection}
              windowTitle={telemetry?.context?.window_title || systemStatus?.window_title || "DESKTOP"}
              recentEvents={recentEvents}
              cameraActive={telemetry?.camera_active ?? systemStatus?.camera_active ?? false}
              cameraRequested={telemetry?.camera_requested ?? systemStatus?.camera_requested ?? false}
              onToggleCamera={handleToggleCamera}
            />
          </div>

          {/* Right Column: SonicHUD Spec & Quick Gesture Manual (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <SonicHUD telemetry={telemetry} onToggleWake={sendWakeState} />

            {/* Printed Spec-Sheet Table for Gestures */}
            <div className="border border-[var(--ink)] bg-[#0B0B0B] p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[var(--grey)]/30 pb-2 mb-3">
                <span className="text-[9px] uppercase tracking-widest text-[var(--grey)]">
                  GESTURE SPECIFICATION TABLE
                </span>
                <button
                  onClick={() => setIsTrainerOpen(true)}
                  className="text-[9px] text-[#7A4EAB] font-bold uppercase hover:underline"
                >
                  [ TRAIN CUSTOM ]
                </button>
              </div>

              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">WAVE (👋)</span>
                  <span className="text-[#1E6B3E] font-bold">&ge; 3 REVERSALS &rarr; WAKE</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">LEFT PALM (✋)</span>
                  <span className="text-[var(--ink)] font-bold">SAFETY CLUTCH ENGAGE</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">INDEX UP (☝️)</span>
                  <span className="text-[#E5322B] font-bold">PLAY / PAUSE</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">PEACE SIGN (✌️)</span>
                  <span className="text-[#E5322B] font-bold">NEXT TRACK</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">3 FINGERS UP (✌️+💍)</span>
                  <span className="text-[#E5322B] font-bold">PREVIOUS TRACK</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">THUMBS UP / DOWN</span>
                  <span className="text-[#E5322B] font-bold">VOLUME &plusmn;6% (REPEATS)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">PINCH &amp; DRAG (🤏)</span>
                  <span className="text-[#E5322B] font-bold">SEEK TIMELINE (&plusmn;45S)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--grey)]/15">
                  <span className="font-bold">CLOSED FIST (✊)</span>
                  <span className="text-[var(--grey)]">HOLD 1.0S &rarr; STANDBY SLEEP</span>
                </div>
                <div className="flex justify-between py-1 text-[10px] text-[var(--grey)]">
                  <span>OPEN PALM (✋)</span>
                  <span>NEUTRAL // NO ACTION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <GestureTrainerModal
        isOpen={isTrainerOpen}
        onClose={() => setIsTrainerOpen(false)}
      />
    </div>
  );
}
