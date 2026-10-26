"use client";

import React, { useState, useEffect } from "react";
import { AppSettings } from "../lib/types";
import { fetchSettings, saveSettings, resetSettingsApi } from "../lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("RESET ALL BUFFERS, THRESHOLDS AND SETTINGS TO FACTORY DEFAULTS?")) {
      return;
    }
    try {
      setIsLoading(true);
      const res = await resetSettingsApi();
      setSettings(res.settings);
      setStatusMsg("ALL THRESHOLDS & BUFFERS RESET TO FACTORY DEFAULTS.");
      if (onSettingsSaved) onSettingsSaved(res.settings);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg(`RESET ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !settings) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await saveSettings(settings);
      setStatusMsg("SETTINGS PERSISTED AND SYNCED TO BACKGROUND PIPELINE.");
      if (onSettingsSaved) onSettingsSaved(res.settings);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg(`ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-xl border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto font-mono text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-technical absolute top-4 right-4 py-1 px-2.5 text-[10px]"
        >
          [ X ]
        </button>

        {/* Header */}
        <div className="border-b border-[var(--ink)] pb-4 mb-5">
          <span className="text-[10px] tracking-widest uppercase text-[var(--grey)]">
            SPECIFICATION // CONFIG
          </span>
          <h2 className="font-display-condensed text-2xl uppercase tracking-tight mt-0.5">
            SYSTEM PARAMETERS
          </h2>
        </div>

        {statusMsg && (
          <div className="mb-4 p-2.5 border border-[#1E6B3E] bg-[#1E6B3E]/10 text-[#1E6B3E] font-bold text-[10px]">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Section 1: Clutch & Grace Period */}
          <div className="flex flex-col gap-3 border border-[var(--ink)] p-3.5">
            <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--ink)]">
              01 // SAFETY CLUTCH & WAKE GRACE
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-2 border border-[var(--ink)] cursor-pointer">
                <span className="text-xs uppercase font-bold">SAFETY CLUTCH</span>
                <input
                  type="checkbox"
                  checked={settings.clutch_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, clutch_enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#E5322B]"
                />
              </label>

              <div className="flex flex-col gap-1 p-2 border border-[var(--ink)]">
                <span className="text-[9px] uppercase text-[var(--grey)]">CLUTCH POSE</span>
                <select
                  value={settings.clutch_pose}
                  onChange={(e) => setSettings({ ...settings, clutch_pose: e.target.value })}
                  className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2 py-1 text-xs text-[var(--ink)] font-mono focus:outline-none"
                >
                  <option value="open_palm">OPEN PALM (DEFAULT)</option>
                  <option value="fist">CLOSED FIST</option>
                </select>
              </div>
            </div>

            {/* Wake Grace Period */}
            <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)]">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold uppercase">WAKE GRACE PERIOD</span>
                <span className="font-bold text-[#E5322B]">{settings.wake_grace_ms || 1500} MS</span>
              </div>
              <input
                type="range"
                min={0}
                max={3000}
                step={100}
                value={settings.wake_grace_ms || 1500}
                onChange={(e) =>
                  setSettings({ ...settings, wake_grace_ms: parseInt(e.target.value) })
                }
                className="w-full accent-[#E5322B]"
              />
              <span className="text-[9px] text-[var(--grey)]">
                Ignores all gesture commands for this duration after waking.
              </span>
            </div>

            {/* Inactivity Timeout */}
            <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)]">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold uppercase">INACTIVITY TIMEOUT</span>
                <span className="font-bold text-[#E5322B]">{settings.inactivity_timeout.toFixed(1)}S</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={30.0}
                step={0.5}
                value={settings.inactivity_timeout}
                onChange={(e) =>
                  setSettings({ ...settings, inactivity_timeout: parseFloat(e.target.value) })
                }
                className="w-full accent-[#E5322B]"
              />
            </div>
          </div>

          {/* Section 2: Recognition & Timing */}
          <div className="flex flex-col gap-3 border border-[var(--ink)] p-3.5">
            <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--ink)]">
              02 // SENSITIVITY & TIMING
            </span>

            {/* Confidence Threshold */}
            <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)]">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold uppercase">MIN CONFIDENCE THRESHOLD</span>
                <span className="font-bold text-[#E5322B]">{Math.round(settings.min_confidence * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.05}
                value={settings.min_confidence}
                onChange={(e) =>
                  setSettings({ ...settings, min_confidence: parseFloat(e.target.value) })
                }
                className="w-full accent-[#E5322B]"
              />
            </div>

            {/* Cooldown */}
            <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)]">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold uppercase">ACTION COOLDOWN</span>
                <span className="font-bold text-[#E5322B]">{settings.cooldown_ms} MS</span>
              </div>
              <input
                type="range"
                min={300}
                max={2000}
                step={50}
                value={settings.cooldown_ms}
                onChange={(e) =>
                  setSettings({ ...settings, cooldown_ms: parseInt(e.target.value) })
                }
                className="w-full accent-[#E5322B]"
              />
            </div>

            {/* Scrub Sensitivity */}
            <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)]">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold uppercase">TIMELINE SCRUB MULTIPLIER</span>
                <span className="font-bold text-[#E5322B]">{settings.scrub_sensitivity.toFixed(1)}X</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={settings.scrub_sensitivity}
                onChange={(e) =>
                  setSettings({ ...settings, scrub_sensitivity: parseFloat(e.target.value) })
                }
                className="w-full accent-[#E5322B]"
              />
            </div>
          </div>

          {/* Section 3: Pinch & Drag Buffers / Thresholds Tuning */}
          <div className="flex flex-col gap-3 border border-[var(--ink)] p-3.5 bg-[var(--paper-dim)]/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--ink)]">
                03 // GESTURE BUFFERS & PINCH/DRAG TUNING
              </span>
              <span className="text-[8px] text-[#E5322B] font-mono tracking-tight font-bold">
                EASY-GRAB HYSTERESIS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pinch & Grab Control Time (Seek Amount) */}
              <div className="sm:col-span-2 flex flex-col gap-2 p-3 border-2 border-[#E5322B] bg-[#E5322B]/5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold uppercase text-xs block text-[#E5322B]">
                      PINCH &amp; GRAB TIME CONTROL (SEEK AMOUNT)
                    </span>
                    <span className="text-[9px] text-[var(--grey)]">
                      Amount of time controlled when pinching and grabbing instead of fixed 10s
                    </span>
                  </div>
                  <span className="font-bold text-sm text-[#E5322B] bg-[#E5322B]/10 px-2 py-0.5 border border-[#E5322B]">
                    &plusmn;{settings.pinch_seek_seconds ?? 10}S
                  </span>
                </div>

                {/* Preset quick buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] text-[var(--grey)] uppercase font-bold mr-1">PRESETS:</span>
                  {[5, 10, 15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSettings({ ...settings, pinch_seek_seconds: sec })}
                      className={`btn-technical text-[9px] py-0.5 px-2 cursor-pointer ${
                        (settings.pinch_seek_seconds ?? 10) === sec
                          ? "bg-[#E5322B] text-white border-[#E5322B]"
                          : "text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                      }`}
                    >
                      {sec}S
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={1}
                    max={120}
                    step={1}
                    value={settings.pinch_seek_seconds ?? 10}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pinch_seek_seconds: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 accent-[#E5322B]"
                  />
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={settings.pinch_seek_seconds ?? 10}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pinch_seek_seconds: Math.max(1, parseFloat(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-[var(--paper-dim)] border border-[var(--ink)] px-2 py-1 text-center font-bold text-xs"
                  />
                </div>
              </div>

              {/* Scrub Range Seconds */}
              <div className="sm:col-span-2 flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">MAXIMUM TIMELINE SCRUB SWEEP RANGE</span>
                  <span className="font-bold text-[#E5322B]">{settings.scrub_range_seconds ?? 60}S</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={settings.scrub_range_seconds ?? 60}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      scrub_range_seconds: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">Full-sweep maximum timeline drag span</span>
              </div>
              {/* Pinch Grab Threshold */}
              <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">PINCH GRAB THRESHOLD</span>
                  <span className="font-bold text-[#E5322B]">
                    {(settings.pinch_on ?? 0.40).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.20}
                  max={0.70}
                  step={0.02}
                  value={settings.pinch_on ?? 0.40}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSettings({
                      ...settings,
                      pinch_on: val,
                      pinch_threshold: val,
                      pinch_off: Math.max(val + 0.10, settings.pinch_off ?? 0.55),
                    });
                  }}
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">Higher = easier to trigger pinch grab</span>
              </div>

              {/* Pinch Release Threshold */}
              <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">PINCH RELEASE (HYSTERESIS)</span>
                  <span className="font-bold text-[#E5322B]">
                    {(settings.pinch_off ?? 0.55).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.30}
                  max={0.90}
                  step={0.02}
                  value={settings.pinch_off ?? 0.55}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pinch_off: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">Finger gap required before letting go of scrub</span>
              </div>

              {/* Confirm Window */}
              <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">CONFIRM WINDOW</span>
                  <span className="font-bold text-[#E5322B]">{settings.confirm_ms ?? 250} MS</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={800}
                  step={25}
                  value={settings.confirm_ms ?? 250}
                  onChange={(e) =>
                    setSettings({ ...settings, confirm_ms: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">Continuous pose hold duration before firing</span>
              </div>

              {/* Release Window */}
              <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">RELEASE REQUIREMENT</span>
                  <span className="font-bold text-[#E5322B]">{settings.release_ms ?? 300} MS</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={800}
                  step={50}
                  value={settings.release_ms ?? 300}
                  onChange={(e) =>
                    setSettings({ ...settings, release_ms: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">Hold-off before pose can be recognized again</span>
              </div>

              {/* Drag Deadzone */}
              <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">DRAG DEADZONE</span>
                  <span className="font-bold text-[#E5322B]">{((settings.drag_deadzone ?? 0.02) * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={0.08}
                  step={0.005}
                  value={settings.drag_deadzone ?? 0.02}
                  onChange={(e) =>
                    setSettings({ ...settings, drag_deadzone: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">Ignores micro-jitter before timeline moves</span>
              </div>

              {/* Drag Smoothing */}
              <div className="flex flex-col gap-1.5 p-2 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">DRAG SMOOTHING</span>
                  <span className="font-bold text-[#E5322B]">{(settings.drag_smoothing ?? 0.30).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.80}
                  step={0.05}
                  value={settings.drag_smoothing ?? 0.30}
                  onChange={(e) =>
                    setSettings({ ...settings, drag_smoothing: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#E5322B]"
                />
                <span className="text-[8px] text-[var(--grey)]">EMA coefficient for fluid playhead motion</span>
              </div>
            </div>
          </div>

          {/* Section 4: Camera */}
          <div className="flex flex-col gap-3 border border-[var(--ink)] p-3.5">
            <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--ink)]">
              04 // CAMERA INPUT
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-2 border border-[var(--ink)] cursor-pointer">
                <div>
                  <span className="text-xs uppercase font-bold block">SYNTHETIC MOCK</span>
                  <span className="text-[8px] text-[var(--grey)]">OFFLINE TEST HANDS</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.mock_camera}
                  onChange={(e) =>
                    setSettings({ ...settings, mock_camera: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#E5322B]"
                />
              </label>

              <div className="flex flex-col gap-1 p-2 border border-[var(--ink)]">
                <span className="text-[9px] uppercase text-[var(--grey)]">TARGET FPS</span>
                <select
                  value={settings.target_fps}
                  onChange={(e) =>
                    setSettings({ ...settings, target_fps: parseInt(e.target.value) })
                  }
                  className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2 py-1 text-xs text-[var(--ink)] font-mono focus:outline-none"
                >
                  <option value={20}>20 FPS (ECO)</option>
                  <option value={30}>30 FPS (STANDARD)</option>
                  <option value={60}>60 FPS (HIGH)</option>
                </select>
              </div>

              {/* Display Mode: Skeleton Alone vs Webcam + Skeleton */}
              <div className="sm:col-span-2 flex flex-col gap-1 p-2 border border-[var(--ink)]">
                <span className="text-[9px] uppercase text-[var(--grey)] font-bold">
                  CANVAS DISPLAY MODE
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, default_view_mode: "skeleton" });
                      if (typeof window !== "undefined") {
                        localStorage.setItem("gesturedeck_view_mode", "skeleton");
                      }
                    }}
                    className={`btn-technical text-[10px] py-1.5 px-3 cursor-pointer ${
                      (settings.default_view_mode ?? "skeleton") === "skeleton"
                        ? "bg-[#E5322B] text-white border-[#E5322B]"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    🦴 SKELETON ALONE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, default_view_mode: "webcam" });
                      if (typeof window !== "undefined") {
                        localStorage.setItem("gesturedeck_view_mode", "webcam");
                      }
                    }}
                    className={`btn-technical text-[10px] py-1.5 px-3 cursor-pointer ${
                      settings.default_view_mode === "webcam"
                        ? "bg-[#1E6B3E] text-white border-[#1E6B3E]"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    📷 WEBCAM + SKELETON
                  </button>
                </div>
                <span className="text-[8px] text-[var(--grey)] mt-1">
                  Choose whether to show the webcam feed behind the skeleton or the skeleton alone on a technical black grid.
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Target Site & Inspection Switch */}
          <div className="flex flex-col gap-3 border border-[var(--ink)] p-3.5">
            <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--ink)]">
              05 // TARGET SITE & LIVE MEDIA INSPECTION
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-2 border border-[var(--ink)] cursor-pointer">
                <div>
                  <span className="text-xs uppercase font-bold block">MEDIA INSPECTION SWITCH</span>
                  <span className="text-[8px] text-[var(--grey)]">ONLY PROBE VIDEO/WINDOW WHEN ON</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.media_detection_enabled ?? false}
                  onChange={(e) =>
                    setSettings({ ...settings, media_detection_enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#E5322B]"
                />
              </label>

              <div className="flex flex-col gap-1 p-2 border border-[var(--ink)]">
                <span className="text-[9px] uppercase text-[var(--grey)]">INTERACTION PROFILE</span>
                <select
                  value={settings.target_profile || "auto"}
                  onChange={(e) =>
                    setSettings({ ...settings, target_profile: e.target.value })
                  }
                  className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2 py-1 text-xs text-[var(--ink)] font-mono focus:outline-none"
                >
                  <option value="auto">AUTO DETECT</option>
                  <option value="youtube">YOUTUBE (SHORTCUTS)</option>
                  <option value="spotify">SPOTIFY (WEB / MEDIA)</option>
                  <option value="generic">GENERIC (SYSTEM KEYS)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Spotify API Credentials */}
          <div className="flex flex-col gap-2 border border-[var(--ink)] p-3.5">
            <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--ink)]">
              06 // SPOTIFY WEB API (OPTIONAL)
            </span>
            <input
              type="text"
              placeholder="CLIENT ID"
              value={settings.spotify_client_id || ""}
              onChange={(e) =>
                setSettings({ ...settings, spotify_client_id: e.target.value || null })
              }
              className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2.5 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none"
            />
            <input
              type="password"
              placeholder="CLIENT SECRET"
              value={settings.spotify_client_secret || ""}
              onChange={(e) =>
                setSettings({ ...settings, spotify_client_secret: e.target.value || null })
              }
              className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2.5 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--ink)]">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="btn-technical text-[10px] text-[#E5322B] border-[#E5322B] hover:bg-[#E5322B] hover:text-[#E7E5E0]"
            >
              [ ↺ RESET TO DEFAULTS ]
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-technical text-[10px]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-technical-accent text-[10px]"
              >
                SAVE PARAMETERS
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
