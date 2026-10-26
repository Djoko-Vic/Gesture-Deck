"use client";

import React, { useState, useEffect } from "react";
import { CustomGesture } from "../lib/types";
import {
  fetchGestures,
  startRecordingGesture,
  cancelRecordingGesture,
  trainGestureModel,
  deleteCustomGesture,
  mapCustomGestureAction,
} from "../lib/api";

interface GestureTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecordingTelemetry?: boolean;
}

const ACTION_OPTIONS = [
  { value: "play_pause", label: "PLAY / PAUSE" },
  { value: "next", label: "NEXT TRACK" },
  { value: "previous", label: "PREVIOUS TRACK" },
  { value: "volume_up", label: "VOLUME UP (+6%)" },
  { value: "volume_down", label: "VOLUME DOWN (-6%)" },
  { value: "mute", label: "TOGGLE MUTE" },
  { value: "seek_forward", label: "SEEK FORWARD (+SEEK STEP)" },
  { value: "seek_backward", label: "SEEK BACKWARD (-SEEK STEP)" },
  { value: "like_song", label: "LIKE SONG ON SPOTIFY" },
];

export const GestureTrainerModal: React.FC<GestureTrainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [gestures, setGestures] = useState<CustomGesture[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLabel, setRecordingLabel] = useState("");
  const [targetSamples, setTargetSamples] = useState(30);
  const [newGestureName, setNewGestureName] = useState("");
  const [trainedClasses, setTrainedClasses] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchGestures();
      setGestures(data.gestures || []);
      setIsRecording(data.is_recording);
      setRecordingLabel(data.recording_label || "");
      setTrainedClasses(data.classes || []);
    } catch (err) {
      // quiet
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isRecording) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchGestures();
        if (!data.is_recording && isRecording) {
          setIsRecording(false);
          setRecordingLabel("");
          setMessage({ text: "SAMPLES CAPTURED. TRIGGER TRAIN MODEL TO COMPILE.", type: "success" });
          loadData();
        }
      } catch (err) {
        // quiet
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isOpen, isRecording]);

  if (!isOpen) return null;

  const handleStartRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGestureName.trim()) return;

    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          triggerBackendRecord();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerBackendRecord = async () => {
    try {
      setIsLoading(true);
      await startRecordingGesture(newGestureName.trim(), targetSamples);
      setIsRecording(true);
      setRecordingLabel(newGestureName.trim());
      setMessage({
        text: `RECORDING '${newGestureName.trim().toUpperCase()}'. HOLD HAND POSE IN FRAME.`,
        type: "info",
      });
      setNewGestureName("");
    } catch (err: any) {
      setMessage({ text: err.message || "FAILED TO START RECORDING", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRecording = async () => {
    try {
      await cancelRecordingGesture();
      setIsRecording(false);
      setRecordingLabel("");
      setCountdown(null);
      setMessage({ text: "RECORDING CANCELLED.", type: "info" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleTrainModel = async () => {
    try {
      setIsLoading(true);
      const res = await trainGestureModel();
      if (res.success) {
        setMessage({ text: res.message || "KNN CLASSIFIER TRAINED.", type: "success" });
        setTrainedClasses(res.classes || []);
      } else {
        setMessage({ text: res.error || "TRAINING FAILED", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "TRAINING ERROR", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`DELETE CUSTOM GESTURE '${name}'?`)) return;
    try {
      await deleteCustomGesture(name);
      setMessage({ text: `DELETED '${name}'`, type: "info" });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleMapAction = async (gestureName: string, action: string) => {
    try {
      await mapCustomGestureAction(gestureName, action);
      setMessage({ text: `MAPPED '${gestureName}' -> '${action}'`, type: "success" });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono text-xs">
      <div className="relative w-full max-w-2xl border border-[#7A4EAB] bg-[var(--paper)] text-[var(--ink)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-technical absolute top-4 right-4 py-1 px-2.5 text-[10px]"
        >
          [ X ]
        </button>

        {/* Header */}
        <div className="border-b border-[#7A4EAB] pb-4 mb-5">
          <span className="text-[10px] tracking-widest uppercase text-[#7A4EAB] font-bold">
            VIOLET STUDIO // ML TRAINER
          </span>
          <h2 className="font-display-condensed text-2xl uppercase tracking-tight text-[var(--ink)] mt-0.5">
            CUSTOM GESTURE CLASSIFIER
          </h2>
          <p className="text-[10px] text-[var(--grey)] uppercase mt-0.5">
            ON-DEVICE SCIKIT-LEARN KNN OVER 63-D WRIST-NORMALIZED VECTORS
          </p>
        </div>

        {/* Notification Message */}
        {message && (
          <div
            className={`mb-4 p-2.5 border text-[10px] font-bold uppercase flex items-center justify-between ${
              message.type === "success"
                ? "border-[#1E6B3E] bg-[#1E6B3E]/10 text-[#1E6B3E]"
                : message.type === "error"
                ? "border-[#E5322B] bg-[#E5322B]/10 text-[#E5322B]"
                : "border-[#7A4EAB] bg-[#7A4EAB]/10 text-[#7A4EAB]"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2 font-bold">
              [X]
            </button>
          </div>
        )}

        {/* Countdown */}
        {countdown !== null && (
          <div className="mb-4 p-6 border-2 border-[#7A4EAB] bg-[#7A4EAB]/10 text-center">
            <span className="text-xs uppercase text-[#7A4EAB] font-bold block mb-1">
              HOLD POSE IN FRAME IN:
            </span>
            <div className="font-display-condensed text-6xl text-[#7A4EAB]">
              {countdown}
            </div>
          </div>
        )}

        {/* Recording active notice */}
        {isRecording && (
          <div className="mb-4 p-3 border-2 border-[#E5322B] bg-[#E5322B]/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#E5322B] block">
                [ RECORDING ACTIVE ]
              </span>
              <span className="text-xs font-bold uppercase">
                CAPTURING POSE SAMPLES FOR &quot;{recordingLabel}&quot;
              </span>
            </div>
            <button
              onClick={handleCancelRecording}
              className="btn-technical text-[9px] py-1 px-2 border-[#E5322B] text-[#E5322B]"
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Form: Record New Gesture */}
        <form onSubmit={handleStartRecording} className="mb-5 p-3.5 border border-[var(--ink)] flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
            RECORD NEW POSE SAMPLES
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="GESTURE NAME (E.G. ROCK SIGN, OK SIGN)"
              value={newGestureName}
              onChange={(e) => setNewGestureName(e.target.value)}
              disabled={isRecording || countdown !== null}
              className="flex-1 bg-[var(--paper-dim)] border border-[var(--ink)] px-2.5 py-1.5 text-xs text-[var(--ink)] font-mono uppercase focus:outline-none"
            />
            <select
              value={targetSamples}
              onChange={(e) => setTargetSamples(Number(e.target.value))}
              disabled={isRecording || countdown !== null}
              className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none"
            >
              <option value={20}>20 SAMPLES (~0.7S)</option>
              <option value={30}>30 SAMPLES (~1.0S)</option>
              <option value={50}>50 SAMPLES (~1.7S)</option>
            </select>
            <button
              type="submit"
              disabled={!newGestureName.trim() || isRecording || countdown !== null}
              className="btn-technical border-[#7A4EAB] text-[#7A4EAB] hover:bg-[#7A4EAB] hover:text-[var(--paper)] text-[10px] py-1.5 px-3 disabled:opacity-40"
            >
              START RECORD
            </button>
          </div>
        </form>

        {/* KNN Engine Info & Train Button */}
        <div className="mb-5 p-3 border border-[var(--ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-[var(--grey)] block">
              TRAINED CLASSES:
            </span>
            <span className="text-xs font-bold text-[#7A4EAB] uppercase">
              {trainedClasses.length > 0 ? trainedClasses.join(", ") : "NONE TRAINED"}
            </span>
          </div>
          <button
            onClick={handleTrainModel}
            disabled={isLoading || isRecording || gestures.length < 2}
            className="btn-technical text-[10px] py-1.5 px-3 border-[#7A4EAB] text-[#7A4EAB] hover:bg-[#7A4EAB] hover:text-[var(--paper)] disabled:opacity-40"
          >
            TRAIN KNN CLASSIFIER
          </button>
        </div>

        {/* Registered Gestures Spec Table */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)] block mb-2">
            GESTURE REPOSITORY ({gestures.length})
          </span>
          {gestures.length === 0 ? (
            <div className="p-4 border border-[var(--ink)] text-center text-[var(--grey)] text-[10px]">
              // NO CUSTOM GESTURES RECORDED. RECORD &ge; 2 GESTURES TO TRAIN.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {gestures.map((g) => (
                <div
                  key={g.name}
                  className="p-2 border border-[var(--ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold uppercase text-[var(--ink)] mr-2">{g.name}</span>
                    <span className="text-[9px] text-[var(--grey)] font-mono">
                      [{g.sample_count} SAMPLES]
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={g.mapping?.action || "none"}
                      onChange={(e) => handleMapAction(g.name, e.target.value)}
                      className="bg-[var(--paper-dim)] border border-[var(--ink)] px-2 py-1 text-[10px] text-[var(--ink)] font-mono uppercase focus:outline-none"
                    >
                      <option value="none">-- NO ACTION --</option>
                      {ACTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDelete(g.name)}
                      className="btn-technical text-[9px] py-1 px-2 border-[#E5322B] text-[#E5322B]"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
