"use client";

import React, { useState } from "react";
import { SystemStatus } from "../lib/types";
import { REMOTECONTROL_BOOKMARKLET, REMOTECONTROL_CONSOLE_SNIPPET } from "../lib/bookmarkletCode";

interface YouTubeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus | null;
  onTriggerAction?: (action: string, params?: Record<string, any>) => void;
}

export const YouTubeBridgeModal: React.FC<YouTubeBridgeModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  onTriggerAction,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = systemStatus?.youtube_bridge?.connected ?? false;
  const bridgeTitle = systemStatus?.youtube_bridge?.title || "Active YouTube Tab";
  const extensionPath = "/home/djokov1c/Proj/yt-hand-tracker/extension";

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-[#0B0B0B] border border-[var(--ink)] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--ink)] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#E5322B] inline-block" />
            <div>
              <span className="text-[10px] text-[var(--grey)] uppercase tracking-wider block">
                INTEGRATION // DOM ENGINE
              </span>
              <h2 className="font-display-condensed text-xl text-[var(--ink)] tracking-tight">
                ⚡ REMOTECONTROL (YOUTUBE BRIDGE)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-technical text-xs py-1 px-3 hover:bg-[var(--grey)]/20"
          >
            [ ESC // CLOSE ]
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-[var(--ink)]">
          {/* Bridge Status Card */}
          <div
            className={`border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              isConnected
                ? "border-[#1E6B3E] bg-[#1E6B3E]/10"
                : "border-[var(--grey)]/40 bg-[#161616]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full inline-block animate-pulse ${
                  isConnected
                    ? "bg-[#1E6B3E] shadow-[0_0_12px_#1E6B3E]"
                    : "bg-[#E5322B] shadow-[0_0_8px_#E5322B]"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display-condensed text-base font-bold uppercase tracking-tight">
                    {isConnected ? "REMOTECONTROL CONNECTED" : "REMOTECONTROL STANDBY"}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 border uppercase font-bold ${
                      isConnected
                        ? "border-[#1E6B3E] text-[#1E6B3E] bg-[#1E6B3E]/20"
                        : "border-[var(--grey)] text-[var(--grey)]"
                    }`}
                  >
                    {isConnected ? "DIRECT DOM ACTIVE" : "AWAITING YOUTUBE TAB"}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--grey)] block mt-0.5 truncate max-w-md">
                  {isConnected
                    ? `Hooked into: "${bridgeTitle}"`
                    : "Connect via Bookmarklet, Extension, or Console to enable site-only volume & visual drag"}
                </span>
              </div>
            </div>

            {/* Quick Test Actions if Connected */}
            {isConnected && onTriggerAction && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onTriggerAction("volume_up")}
                  className="btn-technical text-[10px] py-1 px-2"
                  title="Test Site Volume (+5%)"
                >
                  🔊 VOL +5%
                </button>
                <button
                  onClick={() => onTriggerAction("volume_down")}
                  className="btn-technical text-[10px] py-1 px-2"
                  title="Test Site Volume (-5%)"
                >
                  🔉 VOL -5%
                </button>
                <button
                  onClick={() => onTriggerAction("seek_delta", { delta_seconds: 10 })}
                  className="btn-technical text-[10px] py-1 px-2"
                  title="Test Seek (+10s)"
                >
                  ⟷ +10S
                </button>
                <button
                  onClick={() => onTriggerAction("next")}
                  className="btn-technical text-[10px] py-1 px-2"
                  title="Test Next Video"
                >
                  ⏭ NEXT
                </button>
                <button
                  onClick={() => onTriggerAction("previous")}
                  className="btn-technical text-[10px] py-1 px-2"
                  title="Test Prev / 0:00"
                >
                  ⏮ PREV
                </button>
              </div>
            )}
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-[var(--ink)] bg-[#121212] p-3 flex flex-col gap-1">
              <span className="text-[#E5322B] font-bold text-sm">01 // VISUAL SCRUBBER</span>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Pinch & Drag visibly slides the red progress bar knob and frame preview across the screen like a real mouse!
              </p>
            </div>
            <div className="border border-[var(--ink)] bg-[#121212] p-3 flex flex-col gap-1">
              <span className="text-[#E5322B] font-bold text-sm">02 // SITE-ONLY VOLUME</span>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Thumbs up/down steps only the YouTube video volume (0-100%). Zero effect on host system audio.
              </p>
            </div>
            <div className="border border-[var(--ink)] bg-[#121212] p-3 flex flex-col gap-1">
              <span className="text-[#E5322B] font-bold text-sm">03 // RELIABLE NEXT / PREV</span>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Peace sign (✌️) & Three fingers (✌️+💍) bypass broken shortcuts, advancing standalone videos smoothly.
              </p>
            </div>
          </div>

          {/* Option 1: Bookmarklet (Self-Contained Inline Runner) */}
          <div className="border border-[var(--ink)] bg-[#121212] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--ink)] uppercase flex items-center gap-2">
                <span>📌</span>
                <span>OPTION 1: "RemoteControl" BOOKMARK (RECOMMENDED &amp; ZERO-INSTALL)</span>
              </span>
              <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981] px-1.5 py-0.5 font-bold uppercase">
                ONE-CLICK
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey)] leading-relaxed">
              Click once on any YouTube page to instantly connect site volume, next/prev, and the visual timeline scrubber!
            </p>

            {/* Step-by-step setup guide */}
            <div className="bg-black/60 border border-[var(--grey)]/30 p-3 flex flex-col gap-2 text-[11px]">
              <span className="text-[var(--ink)] font-bold text-[10px] uppercase tracking-wider">
                ⚡ EASY 10-SECOND SETUP:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-[var(--grey)]">
                <li>
                  Click the button below to copy the bookmarklet code:
                  <div className="my-1.5">
                    <button
                      onClick={() => copyToClipboard(REMOTECONTROL_BOOKMARKLET, "bookmarklet")}
                      className={`btn-technical text-xs py-2 px-4 border-2 font-bold transition-all flex items-center gap-2 ${
                        copiedType === "bookmarklet"
                          ? "border-[#10b981] bg-[#10b981] text-black"
                          : "border-[#E5322B] text-[#E5322B] hover:bg-[#E5322B] hover:text-white"
                      }`}
                    >
                      <span>📋</span>
                      <span>{copiedType === "bookmarklet" ? "✓ COPIED BOOKMARKLET CODE!" : "COPY BOOKMARKLET CODE"}</span>
                    </button>
                  </div>
                </li>
                <li>
                  Press <code className="text-[var(--ink)] bg-[#222] px-1.5 py-0.5 font-mono font-bold">Ctrl + D</code> (or right-click your bookmarks bar &rarr; <b>Add page...</b>).
                </li>
                <li>
                  Set Name to <code className="text-[#06b6d4] bg-[#222] px-1.5 py-0.5 font-mono font-bold">RemoteControl</code> and paste the copied code into the <b>URL</b> field.
                </li>
                <li>
                  <b>Done!</b> On any YouTube video, click your <b>RemoteControl</b> bookmark &mdash; you will instantly see the green <span className="text-[#10b981] font-bold">RemoteControl Ready</span> badge on screen!
                </li>
              </ol>
            </div>

            {/* Alternative Drag option */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-[10px] text-[var(--grey)] uppercase tracking-wider font-bold">OR DRAG TO BAR:</span>
              <a
                href={REMOTECONTROL_BOOKMARKLET}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/uri-list", REMOTECONTROL_BOOKMARKLET);
                  e.dataTransfer.setData("text/plain", REMOTECONTROL_BOOKMARKLET);
                  e.dataTransfer.effectAllowed = "link";
                }}
                onClick={(e) => {
                  e.preventDefault();
                  copyToClipboard(REMOTECONTROL_BOOKMARKLET, "bookmarklet");
                }}
                className="btn-technical text-xs py-1.5 px-3 border border-[var(--grey)] text-[var(--ink)] hover:border-[var(--ink)] font-bold transition-all cursor-grab active:cursor-grabbing flex items-center gap-1.5"
                title="Drag to your bookmarks bar (Ctrl+Shift+B)"
              >
                <span>📌</span>
                <span>DRAG "RemoteControl" LINK</span>
              </a>
            </div>
          </div>

          {/* Option 2: Instant Console Paste (2-Second Connection) */}
          <div className="border border-[var(--ink)] bg-[#121212] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--ink)] uppercase">
                ⚡ OPTION 2: INSTANT CONSOLE PASTE (2 SECONDS)
              </span>
              <span className="text-[9px] border border-[#10b981] text-[#10b981] px-1.5 py-0.5 font-bold uppercase">
                INSTANT
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey)] leading-relaxed">
              Want to connect your currently open YouTube tab right now without adding bookmarks?
              <br />
              1. On your YouTube video tab, press <code className="text-[var(--ink)] bg-black px-1.5 py-0.5 font-bold">F12</code> (or right-click → Inspect).
              <br />
              2. Click the <b>Console</b> tab.
              <br />
              3. Click the button below, paste into the console, and press <b>Enter</b>!
            </p>

            <div className="pt-1">
              <button
                onClick={() => copyToClipboard(REMOTECONTROL_CONSOLE_SNIPPET, "console")}
                className="btn-technical text-xs py-2 px-4 border border-[#06b6d4] text-[#06b6d4] font-bold hover:bg-[#06b6d4] hover:text-black flex items-center gap-2"
              >
                <span>📋</span>
                <span>{copiedType === "console" ? "✓ COPIED CONSOLE SCRIPT!" : "COPY CONSOLE SCRIPT"}</span>
              </button>
            </div>
          </div>

          {/* Option 3: Browser Extension (Runs Automatically) */}
          <div className="border border-[var(--ink)] bg-[#121212] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--ink)] uppercase">
                🚀 OPTION 3: "RemoteControl" EXTENSION (PERMANENT AUTO-RUN)
              </span>
              <span className="text-[9px] border border-[var(--grey)] text-[var(--grey)] px-1.5 py-0.5 font-bold uppercase">
                PERMANENT
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey)] leading-relaxed">
              Load the unpacked extension once in Brave/Chrome, and RemoteControl will automatically connect every time you open YouTube.
            </p>

            <ol className="list-decimal list-inside text-[11px] text-[var(--grey)] space-y-1.5 pl-1">
              <li>
                Open <code className="text-[var(--ink)] bg-black px-1 py-0.5">brave://extensions</code> or{" "}
                <code className="text-[var(--ink)] bg-black px-1 py-0.5">chrome://extensions</code>
              </li>
              <li>Toggle <b>Developer mode</b> ON in the top-right corner.</li>
              <li>Click <b>Load unpacked</b> (top-left button).</li>
              <li>Select the <code className="text-[var(--ink)] bg-black px-1 py-0.5">extension/</code> directory:</li>
            </ol>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={extensionPath}
                className="flex-1 bg-black border border-[var(--ink)] px-3 py-1.5 text-[11px] text-[var(--grey)] font-mono select-all"
              />
              <button
                onClick={() => copyToClipboard(extensionPath, "path")}
                className="btn-technical text-xs py-1.5 px-3 shrink-0"
              >
                {copiedType === "path" ? "✓ COPIED PATH!" : "[ COPY PATH ]"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--ink)] bg-[#121212] flex items-center justify-between text-[11px]">
          <span className="text-[var(--grey)]">
            RemoteControl • WebSocket port 8000
          </span>
          <button
            onClick={onClose}
            className="btn-technical text-xs py-1.5 px-4 font-bold"
          >
            [ DONE ]
          </button>
        </div>
      </div>
    </div>
  );
};
