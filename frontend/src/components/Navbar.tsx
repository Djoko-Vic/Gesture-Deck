"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sonicAudio } from "../lib/audio";

interface NavbarProps {
  isConnected?: boolean;
  latencyMs?: number;
  isBridgeConnected?: boolean;
  onOpenSettings?: () => void;
  onOpenTrainer?: () => void;
  onOpenBridge?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected = false,
  latencyMs = 0,
  isBridgeConnected = false,
  onOpenSettings,
  onOpenTrainer,
  onOpenBridge,
}) => {
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(sonicAudio.getMute());
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    sonicAudio.setMute(next);
    setIsMuted(next);
  };

  const isApp = pathname === "/app";

  return (
    <header className="border-b border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-[var(--ink)] text-[var(--paper)] px-1.5 py-0.5">
              GD
            </span>
            <span className="font-display-condensed text-xl tracking-tight uppercase">
              GESTUREDECK
            </span>
            <span className="font-mono text-[9px] text-[var(--grey)] uppercase tracking-widest hidden sm:inline">
              // SONICHUD
            </span>
          </Link>

          {/* Navigation Links with Index Numbers */}
          <nav className="hidden md:flex items-center gap-2 font-display-expanded text-[10px]">
            <Link
              href="/"
              className={`px-2.5 py-1 transition-colors ${
                pathname === "/"
                  ? "bg-[var(--ink)] text-[var(--paper)] font-bold"
                  : "text-[var(--ink)] hover:bg-[var(--paper-dim)]"
              }`}
            >
              01 // OVERVIEW
            </Link>
            <Link
              href="/app"
              className={`px-2.5 py-1 transition-colors ${
                pathname === "/app"
                  ? "bg-[var(--ink)] text-[var(--paper)] font-bold"
                  : "text-[var(--ink)] hover:bg-[var(--paper-dim)]"
              }`}
            >
              02 // STUDIO HUD
            </Link>
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {/* WebSocket Ping Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-[var(--ink)]">
            <span
              className={`inline-block w-2 h-2 ${
                isConnected ? "bg-[#1E6B3E]" : "bg-[#E5322B]"
              }`}
            />
            <span className="uppercase">
              {isConnected ? `${latencyMs}MS RTT` : "OFFLINE"}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="btn-technical text-[10px] py-1 px-2.5"
            title={isMuted ? "Unmute SonicHUD audio synthesis" : "Mute audio synthesis"}
          >
            {isMuted ? "[ MUTE: ON ]" : "[ MUTE: OFF ]"}
          </button>

          {/* YouTube Bridge Button */}
          {onOpenBridge && (
            <button
              onClick={onOpenBridge}
              className={`btn-technical text-[10px] py-1 px-2.5 flex items-center gap-1.5 ${
                isBridgeConnected
                  ? "border-[#1E6B3E] text-[#1E6B3E] hover:bg-[#1E6B3E] hover:text-white"
                  : "border-[#E5322B] text-[#E5322B] hover:bg-[#E5322B] hover:text-white"
              }`}
              title="RemoteControl YouTube Bridge Status & Bookmarklet"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isBridgeConnected ? "bg-[#1E6B3E]" : "bg-[#E5322B]"}`} />
              <span>REMOTECONTROL</span>
            </button>
          )}

          {/* Custom Gesture Trainer Button */}
          {onOpenTrainer && (
            <button
              onClick={onOpenTrainer}
              className="btn-technical text-[10px] py-1 px-2.5 border-[#7A4EAB] text-[#7A4EAB] hover:bg-[#7A4EAB] hover:text-[var(--paper)]"
            >
              TRAINER
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="btn-technical text-[10px] py-1 px-2.5"
            >
              CONFIG
            </button>
          )}

          {/* Direct CTA */}
          {!isApp && (
            <Link
              href="/app"
              className="btn-technical-accent text-[10px] py-1 px-3 ml-1"
            >
              02 // LAUNCH HUD →
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
