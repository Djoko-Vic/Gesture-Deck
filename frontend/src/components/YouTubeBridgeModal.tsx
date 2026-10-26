"use client";

import React, { useState } from "react";
import { SystemStatus } from "../lib/types";
import { REMOTECONTROL_BOOKMARKLET, REMOTECONTROL_CONSOLE_SNIPPET } from "../lib/bookmarkletCode";

interface YouTubeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus | null;
  onTriggerAction?: (action: string, params?: Record<string, any>) => void;
  pinchSeekSeconds?: number;
}

export const YouTubeBridgeModal: React.FC<YouTubeBridgeModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  onTriggerAction,
  pinchSeekSeconds = 10,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookmarklet" | "console" | "extension">("bookmarklet");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-[#0B0B0B] border border-[var(--ink)] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--ink)] bg-[#121212] flex items-center justify-between shrink-0">
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
            className="btn-technical text-xs py-1 px-3 hover:bg-[var(--grey)]/20 cursor-pointer"
          >
            [ ESC // CLOSE ]
          </button>
        </div>

        {/* Content Body - overflow-x-hidden strictly prevents horizontal scrolling */}
        <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden flex flex-col gap-5 text-xs text-[var(--ink)] min-w-0">
          {/* Bridge Status & Test Toolbar */}
          <div
            className={`border p-4 flex flex-col gap-3.5 transition-all min-w-0 ${
              isConnected
                ? "border-[#1E6B3E] bg-[#1E6B3E]/10"
                : "border-[var(--grey)]/40 bg-[#161616]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-3.5 h-3.5 rounded-full inline-block shrink-0 animate-pulse ${
                    isConnected
                      ? "bg-[#1E6B3E] shadow-[0_0_12px_#1E6B3E]"
                      : "bg-[#E5322B] shadow-[0_0_8px_#E5322B]"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display-condensed text-base font-bold uppercase tracking-tight">
                      {isConnected ? "REMOTECONTROL CONNECTED" : "REMOTECONTROL STANDBY"}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 border uppercase font-bold shrink-0 ${
                        isConnected
                          ? "border-[#1E6B3E] text-[#1E6B3E] bg-[#1E6B3E]/20"
                          : "border-[var(--grey)] text-[var(--grey)]"
                      }`}
                    >
                      {isConnected ? "DIRECT DOM ACTIVE" : "AWAITING YOUTUBE TAB"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--grey)] block mt-0.5 truncate max-w-xl">
                    {isConnected
                      ? `Hooked into: "${bridgeTitle}"`
                      : "Connect any YouTube video via Bookmarklet, Console, or Extension below"}
                  </span>
                </div>
              </div>

              {isConnected && (
                <span className="text-[10px] text-[#1E6B3E] font-bold uppercase shrink-0 border border-[#1E6B3E]/30 bg-[#1E6B3E]/10 px-2 py-1">
                  ● LIVE HUD LINK ACTIVE
                </span>
              )}
            </div>

            {/* Quick Test Toolbar */}
            {isConnected && onTriggerAction && (
              <div className="pt-2 border-t border-[var(--ink)]/20 flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-[var(--grey)] font-bold mr-1">
                  TEST BRIDGE:
                </span>
                <button
                  type="button"
                  onClick={() => onTriggerAction("volume_up")}
                  className="btn-technical text-[10px] py-1 px-2.5 hover:bg-white hover:text-black cursor-pointer"
                  title="Test Site Volume (+5%)"
                >
                  🔊 VOL +5%
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerAction("volume_down")}
                  className="btn-technical text-[10px] py-1 px-2.5 hover:bg-white hover:text-black cursor-pointer"
                  title="Test Site Volume (-5%)"
                >
                  🔉 VOL -5%
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerAction("seek_delta", { delta_seconds: pinchSeekSeconds })}
                  className="btn-technical text-[10px] py-1 px-2.5 hover:bg-white hover:text-black cursor-pointer"
                  title={`Test Seek (+${pinchSeekSeconds}s)`}
                >
                  ⟷ +{pinchSeekSeconds}S
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerAction("seek_delta", { delta_seconds: -pinchSeekSeconds })}
                  className="btn-technical text-[10px] py-1 px-2.5 hover:bg-white hover:text-black cursor-pointer"
                  title={`Test Seek (-${pinchSeekSeconds}s)`}
                >
                  ⟷ -{pinchSeekSeconds}S
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerAction("next")}
                  className="btn-technical text-[10px] py-1 px-2.5 hover:bg-white hover:text-black cursor-pointer"
                  title="Test Next Video"
                >
                  ⏭ NEXT
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerAction("previous")}
                  className="btn-technical text-[10px] py-1 px-2.5 hover:bg-white hover:text-black cursor-pointer"
                  title="Test Prev / 0:00"
                >
                  ⏮ PREV
                </button>
              </div>
            )}
          </div>

          {/* Capabilities Grid: 3 Clean Structured Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
            <div className="border border-[var(--ink)] bg-[#121212] p-3.5 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-[#E5322B] font-bold text-xs uppercase tracking-wider">
                <span>01 //</span>
                <span>VISUAL SCRUBBER</span>
              </div>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Pinch &amp; Drag smoothly moves the red progress bar knob and frame preview across the YouTube timeline.
              </p>
            </div>

            <div className="border border-[var(--ink)] bg-[#121212] p-3.5 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-[#E5322B] font-bold text-xs uppercase tracking-wider">
                <span>02 //</span>
                <span>SITE-ONLY VOLUME</span>
              </div>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Thumbs up/down adjusts only the YouTube video volume (0-100%) without affecting host system master audio.
              </p>
            </div>

            <div className="border border-[var(--ink)] bg-[#121212] p-3.5 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-[#E5322B] font-bold text-xs uppercase tracking-wider">
                <span>03 //</span>
                <span>RELIABLE NEXT / PREV</span>
              </div>
              <p className="text-[11px] text-[var(--grey)] leading-relaxed">
                Peace sign (✌️) &amp; Three fingers (✌️+💍) bypass broken shortcuts, advancing standalone videos and playlists.
              </p>
            </div>
          </div>

          {/* Connection Options: Clean Tabbed Interface */}
          <div className="border border-[var(--ink)] bg-[#121212] flex flex-col min-w-0">
            {/* Tab Selector */}
            <div className="flex border-b border-[var(--ink)] bg-black/40 text-[10px] uppercase font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("bookmarklet")}
                className={`py-2.5 px-4 flex items-center gap-2 border-r border-[var(--ink)] cursor-pointer transition-all ${
                  activeTab === "bookmarklet"
                    ? "bg-[#1E6B3E] text-white"
                    : "text-[var(--grey)] hover:text-white hover:bg-white/5"
                }`}
              >
                <span>📌</span>
                <span>1. BOOKMARKLET (RECOMMENDED)</span>
                <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded">ONE-CLICK</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("console")}
                className={`py-2.5 px-4 flex items-center gap-2 border-r border-[var(--ink)] cursor-pointer transition-all ${
                  activeTab === "console"
                    ? "bg-[#06b6d4] text-black"
                    : "text-[var(--grey)] hover:text-white hover:bg-white/5"
                }`}
              >
                <span>⚡</span>
                <span>2. CONSOLE PASTE</span>
                <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded text-white">INSTANT</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("extension")}
                className={`py-2.5 px-4 flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === "extension"
                    ? "bg-[#E5322B] text-white"
                    : "text-[var(--grey)] hover:text-white hover:bg-white/5"
                }`}
              >
                <span>🚀</span>
                <span>3. BROWSER EXTENSION</span>
                <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded">AUTO-RUN</span>
              </button>
            </div>

            {/* Tab 1: Bookmarklet */}
            {activeTab === "bookmarklet" && (
              <div className="p-5 flex flex-col gap-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase">
                      ONE-CLICK BOOKMARKLET SETUP
                    </h3>
                    <p className="text-[11px] text-[var(--grey)] mt-0.5">
                      Works on any browser (Chrome, Brave, Firefox, Edge) without installing files.
                    </p>
                  </div>
                  <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 px-2 py-0.5 font-bold uppercase shrink-0">
                    ZERO INSTALLATION
                  </span>
                </div>

                <div className="bg-black/70 border border-[var(--grey)]/30 p-4 flex flex-col gap-3 min-w-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(REMOTECONTROL_BOOKMARKLET, "bookmarklet")}
                      className={`btn-technical text-xs py-2.5 px-5 border-2 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        copiedType === "bookmarklet"
                          ? "border-[#10b981] bg-[#10b981] text-black"
                          : "border-[#E5322B] text-[#E5322B] hover:bg-[#E5322B] hover:text-white"
                      }`}
                    >
                      <span>📋</span>
                      <span>
                        {copiedType === "bookmarklet"
                          ? "✓ COPIED BOOKMARKLET CODE!"
                          : "COPY BOOKMARKLET CODE"}
                      </span>
                    </button>

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
                      className="btn-technical text-xs py-2.5 px-4 border border-[var(--grey)]/50 text-[var(--ink)] hover:border-white font-bold transition-all cursor-grab active:cursor-grabbing flex items-center justify-center gap-1.5"
                      title="Drag this button to your bookmarks bar"
                    >
                      <span>📌</span>
                      <span>DRAG "RemoteControl" TO BOOKMARKS</span>
                    </a>
                  </div>

                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--grey)] pt-2 border-t border-[var(--grey)]/20">
                    <li>
                      Click <b>COPY BOOKMARKLET CODE</b> above.
                    </li>
                    <li>
                      Press{" "}
                      <code className="text-white bg-[#222] px-1.5 py-0.5 font-bold">
                        Ctrl + D
                      </code>{" "}
                      (or right-click bookmarks bar &rarr; <b>Add page...</b>).
                    </li>
                    <li>
                      Set Name to{" "}
                      <code className="text-[#06b6d4] bg-[#222] px-1.5 py-0.5 font-bold">
                        RemoteControl
                      </code>{" "}
                      and paste the copied script into the <b>URL</b> field.
                    </li>
                    <li>
                      <b>Done!</b> On any YouTube video, click your <b>RemoteControl</b> bookmark &mdash; the green{" "}
                      <span className="text-[#10b981] font-bold">RemoteControl Ready</span> badge will appear instantly!
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tab 2: Console Paste */}
            {activeTab === "console" && (
              <div className="p-5 flex flex-col gap-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase">
                      INSTANT DEVELOPER CONSOLE PASTE
                    </h3>
                    <p className="text-[11px] text-[var(--grey)] mt-0.5">
                      Connect your currently open YouTube tab in 2 seconds without adding bookmarks.
                    </p>
                  </div>
                  <span className="text-[9px] bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/40 px-2 py-0.5 font-bold uppercase shrink-0">
                    2 SECONDS
                  </span>
                </div>

                <div className="bg-black/70 border border-[var(--grey)]/30 p-4 flex flex-col gap-3 min-w-0">
                  <div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(REMOTECONTROL_CONSOLE_SNIPPET, "console")}
                      className={`btn-technical text-xs py-2.5 px-5 border-2 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        copiedType === "console"
                          ? "border-[#10b981] bg-[#10b981] text-black"
                          : "border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:text-black"
                      }`}
                    >
                      <span>📋</span>
                      <span>
                        {copiedType === "console"
                          ? "✓ COPIED CONSOLE SCRIPT!"
                          : "COPY CONSOLE SCRIPT"}
                      </span>
                    </button>
                  </div>

                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--grey)] pt-2 border-t border-[var(--grey)]/20">
                    <li>
                      Go to your YouTube video tab and press{" "}
                      <code className="text-white bg-black px-1.5 py-0.5 font-bold">
                        F12
                      </code>{" "}
                      (or right-click &rarr; <b>Inspect</b>).
                    </li>
                    <li>
                      Select the <b>Console</b> tab.
                    </li>
                    <li>
                      Click the button above, paste into the console, and press <b>Enter</b>!
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tab 3: Browser Extension */}
            {activeTab === "extension" && (
              <div className="p-5 flex flex-col gap-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase">
                      UNPACKED BROWSER EXTENSION (PERMANENT)
                    </h3>
                    <p className="text-[11px] text-[var(--grey)] mt-0.5">
                      Loads automatically on every YouTube video you visit without clicking bookmarks.
                    </p>
                  </div>
                  <span className="text-[9px] bg-white/10 text-white border border-white/20 px-2 py-0.5 font-bold uppercase shrink-0">
                    AUTO-RUN
                  </span>
                </div>

                <div className="bg-black/70 border border-[var(--grey)]/30 p-4 flex flex-col gap-3 min-w-0">
                  <ol className="list-decimal list-inside text-[11px] text-[var(--grey)] space-y-1.5">
                    <li>
                      In Brave or Chrome, navigate to{" "}
                      <code className="text-white bg-black px-1.5 py-0.5">
                        chrome://extensions
                      </code>
                    </li>
                    <li>
                      Toggle <b>Developer mode</b> ON in the top-right corner.
                    </li>
                    <li>
                      Click <b>Load unpacked</b> (top-left button).
                    </li>
                    <li>
                      Select the path below:
                    </li>
                  </ol>

                  <div className="flex items-center gap-2 pt-1 min-w-0">
                    <input
                      type="text"
                      readOnly
                      value={extensionPath}
                      className="flex-1 bg-black border border-[var(--ink)] px-3 py-1.5 text-[11px] text-[var(--grey)] font-mono select-all truncate"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(extensionPath, "path")}
                      className="btn-technical text-xs py-1.5 px-3 shrink-0 cursor-pointer"
                    >
                      {copiedType === "path" ? "✓ COPIED!" : "[ COPY PATH ]"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--ink)] bg-[#121212] flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center gap-3 text-[var(--grey)]">
            <span>RemoteControl • WebSocket port 8000</span>
            <span>•</span>
            <span className="text-white">SEEK STEP: &plusmn;{pinchSeekSeconds}S</span>
          </div>
          <button
            onClick={onClose}
            className="btn-technical text-xs py-1.5 px-5 font-bold cursor-pointer"
          >
            [ DONE ]
          </button>
        </div>
      </div>
    </div>
  );
};
