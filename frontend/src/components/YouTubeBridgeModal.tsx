"use client";

import React, { useState } from "react";
import { SystemStatus } from "../lib/types";

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

  const bookmarkletCode = `javascript:(function(){if(window.__GESTUREDECK_BRIDGE_LOADED__){console.log('GestureDeck Bridge already loaded.');return;}const s=document.createElement('script');s.src='http://localhost:8000/static/extension/content.js?t='+Date.now();s.onload=function(){console.log('GestureDeck Bridge loaded successfully!');};s.onerror=function(){alert('Could not connect to GestureDeck backend at http://localhost:8000. Please start GestureDeck first!');};document.head.appendChild(s);})();`;

  const extensionPath = "/home/djokov1c/Proj/yt-hand-tracker/extension";

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-[#0B0B0B] border border-[var(--ink)] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--ink)] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#E5322B] inline-block" />
            <div>
              <span className="text-[10px] text-[var(--grey)] uppercase tracking-wider block">
                INTEGRATION // DOM BRIDGE
              </span>
              <h2 className="font-display-condensed text-xl text-[var(--ink)] tracking-tight">
                YOUTUBE DECK BRIDGE
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
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-[var(--ink)]">
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
                    {isConnected ? "YOUTUBE BRIDGE CONNECTED" : "BRIDGE STANDBY"}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 border uppercase font-bold ${
                      isConnected
                        ? "border-[#1E6B3E] text-[#1E6B3E] bg-[#1E6B3E]/20"
                        : "border-[var(--grey)] text-[var(--grey)]"
                    }`}
                  >
                    {isConnected ? "DIRECT DOM ACTIVE" : "AWAITING TAB"}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--grey)] block mt-0.5 truncate max-w-md">
                  {isConnected
                    ? `Hooked into: "${bridgeTitle}"`
                    : "Click bookmarklet or install extension on your YouTube tab to enable visual scrubber & site volume"}
                </span>
              </div>
            </div>

            {/* Quick Test Actions if Connected */}
            {isConnected && onTriggerAction && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onTriggerAction("volume_up")}
                  className="btn-technical text-[10px] py-1 px-2"
                  title="Test Site Volume (+5%)"
                >
                  🔊 VOL +5%
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
              </div>
            )}
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-[var(--ink)] bg-[#121212] p-3 flex flex-col gap-1">
              <span className="text-[#E5322B] font-bold text-sm">01 // VISUAL SCRUBBER</span>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Pinch & Drag physically slides the red YouTube knob and preview thumbnail across the progress bar like a real mouse!
              </p>
            </div>
            <div className="border border-[var(--ink)] bg-[#121212] p-3 flex flex-col gap-1">
              <span className="text-[#E5322B] font-bold text-sm">02 // SITE-ONLY VOLUME</span>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Thumbs up/down steps only the YouTube video volume (0-100%). Never touches OS master audio!
              </p>
            </div>
            <div className="border border-[var(--ink)] bg-[#121212] p-3 flex flex-col gap-1">
              <span className="text-[#E5322B] font-bold text-sm">03 // RELIABLE NEXT / PREV</span>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Peace sign (✌️) & Three fingers (✌️+💍) bypass broken shortcuts, advancing standalone videos smoothly.
              </p>
            </div>
          </div>

          {/* Installation Option 1: 1-Click Bookmarklet */}
          <div className="border border-[var(--ink)] bg-[#121212] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--ink)] uppercase">
                ⚡ OPTION 1: 1-CLICK BOOKMARKLET (ZERO INSTALL)
              </span>
              <span className="text-[9px] bg-[#E5322B]/20 text-[#E5322B] border border-[#E5322B] px-1.5 py-0.5 font-bold uppercase">
                FASTEST
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey)] leading-relaxed">
              Drag this button directly to your browser's bookmarks bar (or copy the code and add a new bookmark). When you're on any YouTube video, just click it!
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  // Prevent navigation if accidentally clicked inside the app
                  e.preventDefault();
                  copyToClipboard(bookmarkletCode, "bookmarklet");
                }}
                draggable
                className="btn-technical text-xs py-2 px-4 border-2 border-[#E5322B] text-[#E5322B] font-bold hover:bg-[#E5322B] hover:text-white transition-all cursor-grab active:cursor-grabbing flex items-center gap-2"
                title="Drag to your Bookmarks Bar (Ctrl+Shift+B)"
              >
                <span>📌</span>
                <span>DRAG ME TO BOOKMARKS BAR</span>
              </a>

              <button
                onClick={() => copyToClipboard(bookmarkletCode, "bookmarklet")}
                className="btn-technical text-xs py-2 px-3 text-[var(--grey)] hover:text-[var(--ink)]"
              >
                {copiedType === "bookmarklet" ? "✓ COPIED BOOKMARKLET!" : "[ COPY JAVASCRIPT CODE ]"}
              </button>
            </div>
            <span className="text-[10px] text-[var(--grey)]">
              Tip: Press <code className="text-[#E5322B]">Ctrl + Shift + B</code> in Brave or Chrome to reveal your bookmarks bar.
            </span>
          </div>

          {/* Installation Option 2: Browser Extension */}
          <div className="border border-[var(--ink)] bg-[#121212] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--ink)] uppercase">
                🚀 OPTION 2: BROWSER EXTENSION (AUTOMATIC ON EVERY TAB)
              </span>
              <span className="text-[9px] border border-[var(--grey)] text-[var(--grey)] px-1.5 py-0.5 font-bold uppercase">
                PERMANENT
              </span>
            </div>
            <p className="text-[11px] text-[var(--grey)] leading-relaxed">
              Load the unpacked extension once in Brave/Chrome, and the bridge will automatically activate on every YouTube video you watch.
            </p>

            <ol className="list-decimal list-inside text-[11px] text-[var(--grey)] space-y-1.5 pl-1">
              <li>
                Open <code className="text-[var(--ink)] bg-black px-1 py-0.5">brave://extensions</code> or{" "}
                <code className="text-[var(--ink)] bg-black px-1 py-0.5">chrome://extensions</code>
              </li>
              <li>Toggle <b>Developer mode</b> ON in the top-right corner.</li>
              <li>Click <b>Load unpacked</b> (top-left button).</li>
              <li>Select the <code className="text-[var(--ink)] bg-black px-1 py-0.5">extension/</code> folder in this project:</li>
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
            GestureDeck Engine • WebSocket port 8000
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
