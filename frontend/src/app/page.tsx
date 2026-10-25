"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { DitherHandCanvas } from "../components/DitherHandCanvas";

export default function LandingPage() {
  // Interactive YouTube Pinch-and-Drag demo state on the welcome page
  const [demoPinchDistance, setDemoPinchDistance] = useState<number>(0.32);
  const [demoScrubX, setDemoScrubX] = useState<number>(0); // -1.0 to 1.0
  const [isDemoClutchActive, setIsDemoClutchActive] = useState<boolean>(true);

  const isDemoPinched = demoPinchDistance <= 0.40;
  const demoScrubSeconds = Math.round(demoScrubX * 45);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-sans selection:bg-[var(--ink)] selection:text-[var(--paper)] bg-technical-grid overflow-x-hidden">
      <Navbar />

      {/* =========================================================================
          SECTION 1: HERO — "CREATURA" / "HEAVENLY" DITHER POSTER (FLUID ANIMATIONS)
          ========================================================================= */}
      <section className="relative border-b border-[var(--ink)] pt-10 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
        {/* Tiny uppercase grotesque text in all 4 corners */}
        <div className="absolute top-3 left-4 font-mono text-[10px] tracking-widest uppercase text-[var(--grey)] select-none">
          MAIN LOOP: 30FPS // LOCAL ONLY
        </div>
        <div className="absolute top-3 right-4 font-mono text-[10px] tracking-widest uppercase text-[var(--grey)] select-none text-right">
          (R) REGISTERED // MEDIAPIPE CORE
        </div>
        <div className="absolute bottom-3 left-4 font-mono text-[10px] tracking-widest uppercase text-[var(--grey)] select-none">
          ENTRY BY WAVE // ZERO-CLOUD
        </div>
        <div className="absolute bottom-3 right-4 font-mono text-[10px] tracking-widest uppercase text-[var(--grey)] select-none text-right">
          (C)2026 GESTUREDECK CORP.
        </div>

        {/* 4 Corner Registration Marks with subtle rotational pulse */}
        <motion.span
          animate={{ rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-2 left-2 font-mono text-xs text-[var(--ink)] select-none"
        >
          +
        </motion.span>
        <motion.span
          animate={{ rotate: [0, -90, -180, -270, -360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-2 right-2 font-mono text-xs text-[var(--ink)] select-none"
        >
          +
        </motion.span>
        <motion.span
          animate={{ rotate: [0, -90, -180, -270, -360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-2 left-2 font-mono text-xs text-[var(--ink)] select-none"
        >
          +
        </motion.span>
        <motion.span
          animate={{ rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-2 right-2 font-mono text-xs text-[var(--ink)] select-none"
        >
          +
        </motion.span>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative z-10">
          {/* Section Index Marker with Live Pulsing Radar Beacon */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#E5322B] mb-4 font-bold"
          >
            <span className="w-2 h-2 rounded-full bg-[#E5322B] animate-pulse-dot" />
            <span>✱ 01 // AUTONOMOUS VISION PERCEPTION ✱</span>
          </motion.div>

          {/* Enormous Display Headline in Archivo ExtraCondensed Black */}
          <motion.h1
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-display-condensed text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.88] tracking-[-0.05em] text-[var(--ink)] uppercase max-w-5xl"
          >
            TOUCHLESS MEDIA CONTROLLER
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 font-mono text-xs sm:text-sm text-[var(--ink)] max-w-xl uppercase tracking-wider"
          >
            LOCAL WEBCAM SKELETON TRACKING • DUAL-HAND SAFETY CLUTCH • SONICHUD PROCEDURAL AUDIO
          </motion.p>

          {/* Giant Halftone Reaching Hands Artwork Widget with fluid entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative mt-8 mb-4 w-full max-w-2xl mx-auto flex flex-col items-center group cursor-crosshair"
          >
            {/* Interactive Corner Bracket Reticle */}
            <div className="absolute -inset-2 border border-dashed border-[var(--grey)]/30 pointer-events-none group-hover:border-[#E5322B]/60 transition-colors duration-300" />
            <div className="absolute top-0 right-2 font-mono text-[9px] text-[var(--grey)] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold text-[#E5322B]">
              [ 63-D EMBEDDING ACTIVE ]
            </div>

            <DitherHandCanvas />

            {/* Oversized Jacquard 24 Blackletter Title perfectly centered */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="absolute -bottom-8 sm:-bottom-11 left-1/2 -translate-x-1/2 w-max max-w-[98vw] pointer-events-none select-none flex justify-center items-center z-10"
            >
              <span className="font-blackletter text-7xl sm:text-9xl text-[var(--ink)] tracking-tight whitespace-nowrap text-center drop-shadow-[0_2px_0px_#E7E5E0]">
                GestureDeck
              </span>
            </motion.div>
          </motion.div>

          {/* Subtext and Launch CTAs with hover spring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4 z-20"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/app"
                className="btn-technical-accent text-xs py-3 px-8 text-center flex items-center gap-2 shadow-sm"
              >
                <span>LAUNCH STUDIO HUD (02)</span>
                <span className="animate-pulse">→</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#specs"
                className="btn-technical text-xs py-3 px-8 text-center"
              >
                GESTURE SPEC SHEET ↓
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#youtube-pinch"
                className="btn-technical text-xs py-3 px-6 text-center border-[#E5322B] text-[#E5322B] hover:bg-[#E5322B] hover:text-[#E7E5E0]"
              >
                YOUTUBE PINCH & DRAG ARCHITECTURE ⚡
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          INFINITE TECHNICAL MARQUEE TICKER (FLUID CONTINUOUS RIBBON)
          ========================================================================= */}
      <div className="border-b border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] py-2.5 overflow-hidden select-none font-mono text-[10px] tracking-widest uppercase">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          <span>● 30 FPS LOCAL PIPELINE</span>
          <span className="text-[#E5322B]">✦</span>
          <span>21-LANDMARK MEDIAPIPE TRACKING</span>
          <span className="text-[#E5322B]">✦</span>
          <span>DUAL-HAND SAFETY CLUTCH</span>
          <span className="text-[#E5322B]">✦</span>
          <span>YOUTUBE DIRECT TIMELINE SEEKING</span>
          <span className="text-[#E5322B]">✦</span>
          <span>0.40 EASY-PINCH HYSTERESIS</span>
          <span className="text-[#E5322B]">✦</span>
          <span>PEACE SIGN (✌️) FOR NEXT // 3 FINGERS (✌️+💍) FOR PREVIOUS</span>
          <span className="text-[#E5322B]">✦</span>
          <span>ZERO-CLOUD IN-MEMORY COMPUTER VISION</span>
          <span className="text-[#E5322B]">✦</span>
          <span>SONICHUD PROCEDURAL SYNTHESIZER</span>
          <span className="text-[#E5322B]">✦</span>
          {/* Duplicate loop items for smooth endless ribbon */}
          <span>● 30 FPS LOCAL PIPELINE</span>
          <span className="text-[#E5322B]">✦</span>
          <span>21-LANDMARK MEDIAPIPE TRACKING</span>
          <span className="text-[#E5322B]">✦</span>
          <span>DUAL-HAND SAFETY CLUTCH</span>
          <span className="text-[#E5322B]">✦</span>
          <span>YOUTUBE DIRECT TIMELINE SEEKING</span>
          <span className="text-[#E5322B]">✦</span>
          <span>0.40 EASY-PINCH HYSTERESIS</span>
          <span className="text-[#E5322B]">✦</span>
          <span>PEACE SIGN (✌️) FOR NEXT // 3 FINGERS (✌️+💍) FOR PREVIOUS</span>
          <span className="text-[#E5322B]">✦</span>
          <span>ZERO-CLOUD IN-MEMORY COMPUTER VISION</span>
          <span className="text-[#E5322B]">✦</span>
          <span>SONICHUD PROCEDURAL SYNTHESIZER</span>
          <span className="text-[#E5322B]">✦</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: GESTURE SPEC-SHEET TABLE — PIKE POSTER STYLE (GREEN ACCENT)
          ========================================================================= */}
      <section id="specs" className="py-20 border-b border-[var(--ink)] bg-[var(--paper)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b-2 border-[var(--ink)] pb-4 mb-8 gap-4"
          >
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#1E6B3E] font-bold block">
                ✱ 02 // REPERTORY SPECIFICATION ✱
              </span>
              <h2 className="font-display-condensed text-4xl sm:text-6xl uppercase tracking-tight text-[var(--ink)] mt-1">
                GESTURE TAXONOMY
              </h2>
            </div>
            <div className="font-mono text-xs text-[var(--grey)] text-left sm:text-right uppercase">
              <span>NORM: 63-D WRIST-NORMALIZED</span>
              <span className="block text-[#1E6B3E] font-bold">STABILITY: 4 FRAMES // COOLDOWN: 800MS</span>
            </div>
          </motion.div>

          {/* Spec Sheet Table */}
          <div className="border border-[var(--ink)] overflow-x-auto shadow-sm">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--ink)] text-[var(--paper)] uppercase text-[10px] tracking-wider border-b border-[var(--ink)]">
                  <th className="p-3 border-r border-[var(--paper)]/30">ID</th>
                  <th className="p-3 border-r border-[var(--paper)]/30">GESTURE NAME</th>
                  <th className="p-3 border-r border-[var(--paper)]/30">FINGERS</th>
                  <th className="p-3 border-r border-[var(--paper)]/30">DIRECTION</th>
                  <th className="p-3 border-r border-[var(--paper)]/30">ACTION DISPATCH</th>
                  <th className="p-3">SAFETY CRITERIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink)]">
                {/* 1. Play / Pause */}
                <tr className="hover:bg-[var(--paper-dim)] transition-colors group">
                  <td className="p-3 font-bold text-[#1E6B3E] border-r border-[var(--ink)]">01</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] group-hover:text-[#E5322B] transition-colors">INDEX POINTING UP</td>
                  <td className="p-3 border-r border-[var(--ink)]">01 EXTENDED</td>
                  <td className="p-3 border-r border-[var(--ink)]">VERTICAL (UP)</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">PLAY / PAUSE</td>
                  <td className="p-3 text-[var(--grey)]">MIDDLE/RING/PINKY FOLDED</td>
                </tr>

                {/* 2. Next Track */}
                <tr className="hover:bg-[var(--paper-dim)] transition-colors group">
                  <td className="p-3 font-bold text-[#1E6B3E] border-r border-[var(--ink)]">02</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] group-hover:text-[#E5322B] transition-colors">PEACE SIGN (✌️)</td>
                  <td className="p-3 border-r border-[var(--ink)]">INDEX + MIDDLE</td>
                  <td className="p-3 border-r border-[var(--ink)]">VERTICAL (UP)</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">NEXT TRACK</td>
                  <td className="p-3 text-[var(--grey)]">RING &amp; PINKY FOLDED // PEACE V-SIGN</td>
                </tr>

                {/* 3. Previous Track */}
                <tr className="hover:bg-[var(--paper-dim)] transition-colors group">
                  <td className="p-3 font-bold text-[#1E6B3E] border-r border-[var(--ink)]">03</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] group-hover:text-[#E5322B] transition-colors">THREE FINGERS (✌️+💍)</td>
                  <td className="p-3 border-r border-[var(--ink)]">INDEX + MID + RING</td>
                  <td className="p-3 border-r border-[var(--ink)]">VERTICAL (UP)</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">PREVIOUS TRACK</td>
                  <td className="p-3 text-[var(--grey)]">PINKY FOLDED // NUMBER THREE POSE</td>
                </tr>

                {/* 4. Volume Up */}
                <tr className="hover:bg-[var(--paper-dim)] transition-colors group">
                  <td className="p-3 font-bold text-[#1E6B3E] border-r border-[var(--ink)]">04</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] group-hover:text-[#E5322B] transition-colors">THUMBS UP</td>
                  <td className="p-3 border-r border-[var(--ink)]">01 (THUMB)</td>
                  <td className="p-3 border-r border-[var(--ink)]">VERTICAL (UP)</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">VOLUME UP (+6%)</td>
                  <td className="p-3 text-[var(--grey)]">4 FINGERS FOLDED // REPEATS ~600MS</td>
                </tr>

                {/* 5. Volume Down */}
                <tr className="hover:bg-[var(--paper-dim)] transition-colors group">
                  <td className="p-3 font-bold text-[#1E6B3E] border-r border-[var(--ink)]">05</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] group-hover:text-[#E5322B] transition-colors">THUMBS DOWN</td>
                  <td className="p-3 border-r border-[var(--ink)]">01 (THUMB)</td>
                  <td className="p-3 border-r border-[var(--ink)]">VERTICAL (DOWN)</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">VOLUME DOWN (-6%)</td>
                  <td className="p-3 text-[var(--grey)]">4 FINGERS FOLDED // REPEATS ~600MS</td>
                </tr>

                {/* 6. Timeline Scrub */}
                <tr className="hover:bg-[#E5322B]/10 transition-colors group bg-[#E5322B]/5">
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">06</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] text-[#E5322B]">PINCH &amp; DRAG</td>
                  <td className="p-3 border-r border-[var(--ink)]">THUMB + INDEX</td>
                  <td className="p-3 border-r border-[var(--ink)]">DELTA X (+/-45S)</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">SEEK TIMELINE</td>
                  <td className="p-3 text-[var(--ink)] font-bold">ENFORCES CLUTCH // RELEASE COMMITS</td>
                </tr>

                {/* 7. Sleep */}
                <tr className="hover:bg-[var(--paper-dim)] transition-colors group">
                  <td className="p-3 font-bold text-[#1E6B3E] border-r border-[var(--ink)]">07</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)] group-hover:text-[#E5322B] transition-colors">CLOSED FIST</td>
                  <td className="p-3 border-r border-[var(--ink)]">00 EXTENDED</td>
                  <td className="p-3 border-r border-[var(--ink)]">STATIC</td>
                  <td className="p-3 font-bold text-[#E5322B] border-r border-[var(--ink)]">STANDBY SLEEP</td>
                  <td className="p-3 text-[var(--grey)]">CONTINUOUS HOLD &ge; 1.0 SECOND</td>
                </tr>

                {/* 8. Neutral Open Palm */}
                <tr className="bg-[var(--paper-dim)]/50">
                  <td className="p-3 font-bold text-[var(--grey)] border-r border-[var(--ink)]">08</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)]">OPEN PALM (RIGHT)</td>
                  <td className="p-3 border-r border-[var(--ink)]">05 EXTENDED</td>
                  <td className="p-3 border-r border-[var(--ink)]">FRONT FACING</td>
                  <td className="p-3 font-bold text-[var(--grey)] border-r border-[var(--ink)]">[ NO ACTION ]</td>
                  <td className="p-3 text-[var(--grey)]">NEUTRAL SAFETY POSE AFTER WAVE</td>
                </tr>

                {/* 9. Peace Sign Up */}
                <tr className="bg-[var(--paper-dim)]/50">
                  <td className="p-3 font-bold text-[var(--grey)] border-r border-[var(--ink)]">09</td>
                  <td className="p-3 font-bold border-r border-[var(--ink)]">PEACE SIGN UP</td>
                  <td className="p-3 border-r border-[var(--ink)]">02 EXTENDED</td>
                  <td className="p-3 border-r border-[var(--ink)]">VERTICAL (UP)</td>
                  <td className="p-3 font-bold text-[var(--grey)] border-r border-[var(--ink)]">[ NO ACTION ]</td>
                  <td className="p-3 text-[var(--grey)]">NEUTRAL SAFETY POSE (SWAY IMMUNE)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2.5: HOW PINCH & DRAG WORKS FOR YOUTUBE VIDEOS (INTERACTIVE DECK)
          ========================================================================= */}
      <section id="youtube-pinch" className="py-20 border-b border-[var(--ink)] bg-[var(--paper-dim)]/40 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="border-b-2 border-[#E5322B] pb-4 mb-8"
          >
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-[#E5322B] font-bold">
              <span>✱ HOW IT WORKS // VIDEO TIMELINE CONTROL ✱</span>
            </div>
            <h2 className="font-display-condensed text-4xl sm:text-6xl uppercase tracking-tight text-[var(--ink)] mt-1">
              YOUTUBE PINCH &amp; DRAG SCRUBBING
            </h2>
            <p className="font-mono text-xs uppercase text-[var(--grey)] mt-1">
              PHYSICAL HAND GEOMETRY → NORMALIZED ANCHOR LOCK → HYSTERESIS BUFFER → NATIVE OS SEEK DISPATCH
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Step-by-Step Architecture Explanation */}
            <div className="lg:col-span-7 flex flex-col gap-4 font-mono text-xs">
              {/* Step 1: Clutch */}
              <div className="p-4 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#1E6B3E] uppercase text-[11px]">
                    01 // LEFT-HAND CLUTCH PREREQUISITE
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] border border-[#1E6B3E] text-[#1E6B3E] font-bold">
                    AIR SAFETY LOCK
                  </span>
                </div>
                <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                  Before timeline seeking can activate, your <strong>left hand</strong> must be held open (or configured clutch pose). This dual-hand interlock prevents accidental seeks whenever you rest your hand or touch your face.
                </p>
              </div>

              {/* Step 2: Wrist-Normalized Landmark Distance */}
              <div className="p-4 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#E5322B] uppercase text-[11px]">
                    02 // 0.40 EASY-GRAB THRESHOLD
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] border border-[#E5322B] text-[#E5322B] font-bold">
                    INCREASED RECOGNITION
                  </span>
                </div>
                <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                  MediaPipe tracks <strong>Thumb Tip (Landmark 4)</strong> and <strong>Index Tip (Landmark 8)</strong>. The 3D distance between them is divided by your wrist-to-middle-finger knuckle distance.
                  We boosted the grab threshold from <code className="text-[#E5322B]">0.24 → 0.40</code> so you don&apos;t have to squeeze uncomfortably tight—a relaxed, natural touch instantly triggers a grab!
                </p>
              </div>

              {/* Step 3: Stateful Hysteresis Buffer */}
              <div className="p-4 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[var(--ink)] uppercase text-[11px]">
                    03 // DUAL HYSTERESIS (0.40 GRAB / 0.55 RELEASE)
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] border border-[var(--ink)] text-[var(--ink)] font-bold">
                    DROPOUT PROOF
                  </span>
                </div>
                <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                  Once grabbed at &le; 0.40, the state machine switches into <strong>SCRUBBING</strong>. To avoid stuttering or dropping mid-drag, it requires the gap to exceed <strong>0.55</strong> before releasing, backed by a 6-frame dropout grace period.
                </p>
              </div>

              {/* Step 4: Horizontal Sweep & Exponential Smoothing */}
              <div className="p-4 border border-[var(--ink)] bg-[var(--paper)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[var(--ink)] uppercase text-[11px]">
                    04 // ANCHOR LOCK &amp; EMA POSITION SMOOTHING
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] border border-[var(--ink)] text-[var(--ink)] font-bold">
                    FLUID MOTION
                  </span>
                </div>
                <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                  The instant you pinch, GestureDeck memorizes your horizontal position as the <strong>Anchor Point (0s)</strong>.
                  Moving hand left sweeps backward (up to -45s); moving hand right sweeps forward (up to +45s). An Exponential Moving Average (EMA) and 2% deadzone filter eliminate natural hand trembling.
                </p>
              </div>

              {/* Step 5: How YouTube Video Seeks Are Executed */}
              <div className="p-4 border-2 border-[#E5322B] bg-[var(--paper)] shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[#E5322B] uppercase text-[11px]">
                    05 // EXACT YOUTUBE SEEK EXECUTION (RELEASE-TO-COMMIT)
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-[#E5322B] text-[var(--paper)] font-bold">
                    ZERO ACCIDENTAL COMMITS
                  </span>
                </div>
                <p className="text-[var(--ink)] uppercase leading-relaxed text-[11px]">
                  While your fingers remain pinched, you see the live scrub offset previewed on your SonicHUD. When you open your fingers (releasing the pinch), GestureDeck commits the seek:
                </p>
                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 border border-[var(--ink)] bg-[var(--paper-dim)]">
                    <span className="font-bold block text-[var(--ink)]">// BROWSER SHORTCUT MODE</span>
                    <span className="text-[var(--grey)]">Taps Left/Right Arrow keys (5s chunks) or J/L keys (10s chunks) in rapid sequence matching the scrubbed delta.</span>
                  </div>
                  <div className="p-2 border border-[var(--ink)] bg-[var(--paper-dim)]">
                    <span className="font-bold block text-[#1E6B3E]">// LINUX MPRIS D-BUS MODE</span>
                    <span className="text-[var(--grey)]">Calls <code className="text-[var(--ink)]">org.mpris.MediaPlayer2.Player.Seek()</code> directly via D-Bus, repositioning playback head without needing window focus.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Visual Scrubbing Simulator */}
            <div className="lg:col-span-5 border-2 border-[var(--ink)] bg-[var(--paper)] p-5 flex flex-col gap-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[var(--ink)] pb-3">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[var(--grey)] block">
                    LIVE INTERACTIVE LAB
                  </span>
                  <span className="font-display-condensed text-xl text-[var(--ink)] uppercase">
                    PINCH &amp; DRAG SIMULATOR
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                  isDemoPinched && isDemoClutchActive
                    ? "border-[#E5322B] bg-[#E5322B] text-white"
                    : "border-[var(--grey)] text-[var(--grey)]"
                }`}>
                  {isDemoPinched && isDemoClutchActive ? "SCRUBBING ACTIVE" : "STANDBY"}
                </span>
              </div>

              {/* Safety Clutch Toggle in Simulator */}
              <label className="flex items-center justify-between p-2.5 border border-[var(--ink)] cursor-pointer bg-[var(--paper-dim)]">
                <div>
                  <span className="font-bold uppercase text-[10px] block">LEFT-HAND SAFETY CLUTCH</span>
                  <span className="text-[8px] text-[var(--grey)]">MUST BE ENGAGED TO DRAG</span>
                </div>
                <input
                  type="checkbox"
                  checked={isDemoClutchActive}
                  onChange={(e) => setIsDemoClutchActive(e.target.checked)}
                  className="w-4 h-4 accent-[#E5322B]"
                />
              </label>

              {/* Pinch Distance Slider */}
              <div className="flex flex-col gap-1 p-2.5 border border-[var(--ink)] bg-[var(--paper-dim)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">FINGER GAP (THUMB-INDEX)</span>
                  <span className={`font-bold ${isDemoPinched ? "text-[#E5322B]" : "text-[var(--grey)]"}`}>
                    {demoPinchDistance.toFixed(2)} {isDemoPinched ? "[ PINCHED ]" : "[ OPEN ]"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={0.70}
                  step={0.02}
                  value={demoPinchDistance}
                  onChange={(e) => setDemoPinchDistance(parseFloat(e.target.value))}
                  className="w-full accent-[#E5322B]"
                />
                <div className="flex justify-between text-[8px] text-[var(--grey)]">
                  <span>0.15 (TIGHT)</span>
                  <span className="text-[#E5322B] font-bold">THRESHOLD 0.40 (EASY)</span>
                  <span>0.70 (OPEN)</span>
                </div>
              </div>

              {/* Drag Position Slider (Active only when pinched and clutched) */}
              <div className="flex flex-col gap-1 p-2.5 border border-[var(--ink)] bg-[var(--paper-dim)]">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase">HORIZONTAL HAND SWEEP (X)</span>
                  <span className="font-bold text-[#E5322B]">
                    {demoScrubSeconds > 0 ? `+${demoScrubSeconds}S` : `${demoScrubSeconds}S`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-1.0}
                  max={1.0}
                  step={0.05}
                  disabled={!isDemoPinched || !isDemoClutchActive}
                  value={demoScrubX}
                  onChange={(e) => setDemoScrubX(parseFloat(e.target.value))}
                  className="w-full accent-[#E5322B] disabled:opacity-30"
                />
                <div className="flex justify-between text-[8px] text-[var(--grey)]">
                  <span>-45S (SEEK BACK)</span>
                  <span>ANCHOR [ 0.0 ]</span>
                  <span>+45S (SEEK FORWARD)</span>
                </div>
              </div>

              {/* Simulated YouTube Player Progress Bar */}
              <div className="border border-[var(--ink)] p-3 bg-black text-white flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-mono text-[var(--grey)]">
                  <span>YOUTUBE PLAYHEAD</span>
                  <span className="text-[#E5322B] font-bold">
                    {isDemoPinched && isDemoClutchActive
                      ? `PREVIEW: ${demoScrubSeconds > 0 ? "+" : ""}${demoScrubSeconds}S`
                      : "READY"}
                  </span>
                </div>

                {/* Progress Bar with Scrub Knob */}
                <div className="relative w-full h-3 bg-neutral-800 rounded-none overflow-visible flex items-center">
                  <div className="h-full bg-red-600 w-1/3" />
                  {/* Floating Thumb Marker */}
                  <motion.div
                    animate={{ x: `${(demoScrubX + 1.0) * 120}px` }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute w-4 h-4 bg-[#E5322B] border-2 border-white cursor-pointer shadow-lg -translate-x-1/2"
                  />
                </div>

                <div className="flex justify-between text-[9px] font-mono text-[var(--grey)]">
                  <span>02:14</span>
                  <span className="text-white font-bold">
                    {isDemoPinched && isDemoClutchActive ? "RELEASE PINCH TO COMMIT SEEK" : "PINCH & DRAG TO SCRUB"}
                  </span>
                  <span>08:45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SAFETY ARCHITECTURE — TECHNICAL FLAME POSTER STYLE (01 → 02 → 03)
          ========================================================================= */}
      <section className="py-20 border-b border-[var(--ink)] bg-[var(--paper)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="border-b-2 border-[var(--ink)] pb-4 mb-10"
          >
            <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--grey)] font-bold block">
              ✱ 03 // SAFETY INTERLOCK SPECIFICATION ✱
            </span>
            <h2 className="font-display-condensed text-4xl sm:text-6xl uppercase tracking-tight text-[var(--ink)] mt-1">
              ACCIDENTAL TRIGGER IMMUNITY
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <motion.div
              whileHover={{ y: -6, borderColor: "#E5322B" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="border border-[var(--ink)] p-6 bg-[var(--paper)] relative shadow-sm transition-colors duration-200"
            >
              <span className="font-display-condensed text-5xl sm:text-6xl text-[var(--ink)] block mb-2">
                01 →
              </span>
              <h3 className="font-display-condensed text-xl uppercase tracking-tight text-[var(--ink)] mb-2">
                DIRECTIONAL WAVE TO WAKE
              </h3>
              <p className="font-mono text-xs text-[var(--grey)] uppercase leading-relaxed">
                Tracks wrist X coordinate over rolling 1.0s buffer. Requires &ge;3 sign reversals with minimum amplitude threshold + open palm facing camera.
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--ink)] font-mono text-[10px] text-[var(--ink)] uppercase font-bold">
                // PREVENTS STRAY MOVEMENT WAKES
              </div>
            </motion.div>

            {/* Step 02 */}
            <motion.div
              whileHover={{ y: -6, borderColor: "#E5322B" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="border border-[var(--ink)] p-6 bg-[var(--paper)] relative shadow-sm transition-colors duration-200"
            >
              <span className="font-display-condensed text-5xl sm:text-6xl text-[#E5322B] block mb-2">
                02 →
              </span>
              <h3 className="font-display-condensed text-xl uppercase tracking-tight text-[var(--ink)] mb-2">
                1500MS WAKE GRACE PERIOD
              </h3>
              <p className="font-mono text-xs text-[var(--grey)] uppercase leading-relaxed">
                Immediately after transitioning from SLEEPING to ACTIVE, the controller ignores ALL commands for 1.5 seconds (<code className="text-[#E5322B]">wake_grace_ms</code>).
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--ink)] font-mono text-[10px] text-[var(--ink)] uppercase font-bold">
                // WAVE HAND ENDS SAFE WITH NO TRIGGER
              </div>
            </motion.div>

            {/* Step 03 */}
            <motion.div
              whileHover={{ y: -6, borderColor: "#1E6B3E" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="border border-[var(--ink)] p-6 bg-[var(--paper)] relative shadow-sm transition-colors duration-200"
            >
              <span className="font-display-condensed text-5xl sm:text-6xl text-[#1E6B3E] block mb-2">
                03 ✱
              </span>
              <h3 className="font-display-condensed text-xl uppercase tracking-tight text-[var(--ink)] mb-2">
                LEFT-HAND CLUTCH GUARD
              </h3>
              <p className="font-mono text-xs text-[var(--grey)] uppercase leading-relaxed">
                4-frame debounce hold to engage; 4-frame hysteresis linger on release. Risky operations (timeline scrubbing) always enforce clutch engagement.
              </p>
              <div className="mt-4 pt-3 border-t border-[var(--ink)] font-mono text-[10px] text-[var(--ink)] uppercase font-bold">
                // DUAL-HAND AIR SAFETY LOCK
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CUSTOM GESTURE ML TRAINER (VIOLET ACCENT)
          ========================================================================= */}
      <section className="py-20 border-b border-[var(--ink)] bg-[var(--paper)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b-2 border-[#7A4EAB] pb-4 mb-8 gap-4"
          >
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#7A4EAB] font-bold block">
                ✱ 04 // ON-DEVICE SCIKIT-LEARN ENGINE ✱
              </span>
              <h2 className="font-display-condensed text-4xl sm:text-6xl uppercase tracking-tight text-[var(--ink)] mt-1">
                GESTURE TRAINER STUDIO
              </h2>
            </div>
            <div className="font-mono text-xs text-[#7A4EAB] text-left sm:text-right uppercase">
              <span>ALGORITHM: DISTANCE-WEIGHTED KNN</span>
              <span className="block font-bold">LATENCY: &lt; 0.5MS CPU PREDICT</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4 font-mono text-xs uppercase text-[var(--grey)] leading-relaxed">
              <p className="text-[var(--ink)] font-bold text-sm">
                Record 30 landmark frames for any custom hand geometry.
              </p>
              <p>
                The trainer normalizes 21 3D coordinates relative to the wrist and scales by palm distance. The resulting 63-dimensional feature vector is invariant to camera distance, hand scale, and room position.
              </p>
              <p>
                Map trained gestures to system media keys, Spotify Web API actions, browser URLs, or custom OS keyboard shortcuts.
              </p>
              <div className="pt-2">
                <Link
                  href="/app"
                  className="btn-technical border-[#7A4EAB] text-[#7A4EAB] hover:bg-[#7A4EAB] hover:text-[var(--paper)]"
                >
                  OPEN STUDIO TRAINER →
                </Link>
              </div>
            </div>

            {/* Decorative Poster Block with QR Block & Bloom Spec */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="border-2 border-[#7A4EAB] bg-[#7A4EAB]/5 p-6 flex flex-col justify-between min-h-[260px] relative shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#7A4EAB] font-bold">
                  MODEL // GESTURE_MODEL.JOBLIB
                </span>
                <span className="font-mono text-[9px] uppercase text-[var(--grey)]">
                  FORMAT: SCIKIT-LEARN
                </span>
              </div>

              {/* Decorative Bayer Dither Pattern Box */}
              <div className="my-6 border border-[#7A4EAB] p-4 bg-[var(--paper)] flex items-center justify-between">
                <div>
                  <span className="font-display-condensed text-3xl text-[#7A4EAB] block">
                    63-D EMBEDDING
                  </span>
                  <span className="font-mono text-[9px] text-[var(--grey)] uppercase">
                    INPUT: [WRIST_X0, Y0, Z0 ... TIP_X20, Y20, Z20]
                  </span>
                </div>
                {/* Decorative Simulated QR Block */}
                <div className="w-12 h-12 bg-[#7A4EAB] p-1 grid grid-cols-4 gap-0.5">
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[var(--paper)]"></div>
                  <div className="bg-[#7A4EAB]"></div>
                </div>
              </div>

              <div className="flex justify-between font-mono text-[9px] text-[var(--grey)] uppercase">
                <span>CONFIDENCE GATE: &ge;75%</span>
                <span>PERSISTENCE: LOCAL JSON</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PRIVACY GUARANTEE — INVERTED BLACK BLOCK (CYAN ACCENT)
          ========================================================================= */}
      <section className="py-20 border-b border-[var(--ink)] bg-[#0B0B0B] text-[#E7E5E0] relative overflow-hidden">
        {/* Animated subtle laser scanning line */}
        <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#5BA8E0]/40 to-transparent animate-laser pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="border-b border-[#5BA8E0]/40 pb-4 mb-8">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#5BA8E0] font-bold block">
              ✱ 05 // LOCAL SECURITY POLICY ✱
            </span>
          </div>

          <div className="max-w-4xl">
            <h2 className="font-display-condensed text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#E7E5E0] leading-none mb-6">
              YOUR CAMERA NEVER LEAVES YOUR COMPUTER.
            </h2>
            <p className="font-mono text-xs sm:text-sm text-[#9B9A96] uppercase leading-relaxed max-w-2xl">
              GestureDeck performs all computer vision inference strictly on your local CPU/GPU using MediaPipe Tasks and OpenCV. Video frames are processed in-memory and discarded immediately. Only 21 geometric coordinate pairs are streamed over local loopback (<code className="text-[#5BA8E0]">127.0.0.1:8000</code>).
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#9B9A96]/20 font-mono text-xs uppercase">
              <div>
                <span className="text-[#5BA8E0] font-bold block">ZERO CLOUD STREAMING</span>
                <span className="text-[10px] text-[#9B9A96]">No external telemetry or frame uploads</span>
              </div>
              <div>
                <span className="text-[#5BA8E0] font-bold block">NO DISK STORAGE OF VIDEO</span>
                <span className="text-[10px] text-[#9B9A96]">Raw frames never touch filesystem</span>
              </div>
              <div>
                <span className="text-[#5BA8E0] font-bold block">OFFLINE AIRGAP READY</span>
                <span className="text-[10px] text-[#9B9A96]">Fully operational without internet access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FAQ & QUICKSTART
          ========================================================================= */}
      <section className="py-20 border-b border-[var(--ink)] bg-[var(--paper)] font-mono text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="border-b-2 border-[var(--ink)] pb-4 mb-8">
            <span className="text-[10px] tracking-widest uppercase text-[var(--grey)] font-bold block">
              ✱ 06 // TECHNICAL FAQ &amp; VERIFICATION ✱
            </span>
            <h2 className="font-display-condensed text-4xl sm:text-5xl uppercase tracking-tight text-[var(--ink)] mt-1">
              QUESTIONS &amp; ARCHITECTURE
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-[var(--ink)] p-4 bg-[var(--paper)]">
              <span className="font-bold text-[var(--ink)] block mb-1">
                // HOW DOES PINCH &amp; DRAG CONTROL YOUTUBE?
              </span>
              <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                Hold your left hand open to disengage safety clutch. Bring your right thumb and index tips together (relaxed 0.40 threshold). Move your hand horizontally left or right to scrub (-45s to +45s). When you release the pinch, GestureDeck dispatches native left/right arrow keystrokes or D-Bus MPRIS commands to jump YouTube immediately.
              </p>
            </div>

            <div className="border border-[var(--ink)] p-4 bg-[var(--paper)]">
              <span className="font-bold text-[var(--ink)] block mb-1">
                // WHY DOES OPEN PALM DO NOTHING?
              </span>
              <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                When waving to wake the controller, your hand finishes in an open palm pose. Making open palm neutral prevents accidental commands right after wake-up.
              </p>
            </div>

            <div className="border border-[var(--ink)] p-4 bg-[var(--paper)]">
              <span className="font-bold text-[var(--ink)] block mb-1">
                // WHAT IS NEUTRAL RESET?
              </span>
              <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                After an action fires, that same gesture cannot fire again until the hand has completely left the pose for at least 300ms. Holding a pose never repeat-fires, except for volume controls which repeat slowly (~600ms).
              </p>
            </div>

            <div className="border border-[var(--ink)] p-4 bg-[var(--paper)]">
              <span className="font-bold text-[var(--ink)] block mb-1">
                // CAN I TEST WITHOUT A WEBCAM?
              </span>
              <p className="text-[var(--grey)] uppercase leading-relaxed text-[11px]">
                Yes. GestureDeck includes an automated synthetic mock camera mode that oscillates through wave, index pointing up, horizontal pointing, and pinch drag for automated verification.
              </p>
            </div>
          </div>

          {/* Quickstart Command Block */}
          <div className="mt-12 p-6 border-2 border-[var(--ink)] bg-[var(--paper)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-[var(--grey)] uppercase tracking-wider block">
                UNIFIED DEVELOPMENT LAUNCHER
              </span>
              <code className="font-bold text-base text-[var(--ink)]">
                ./run_dev.sh
              </code>
              <span className="text-[10px] text-[var(--grey)] block mt-0.5">
                CONCURRENTLY INITIALIZES FASTAPI (:8000) &amp; NEXT.JS (:3000)
              </span>
            </div>
            <Link
              href="/app"
              className="btn-technical-accent text-xs py-2.5 px-6 shrink-0"
            >
              LAUNCH STUDIO HUD →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[var(--paper)] text-[var(--ink)] font-mono text-[10px] border-t border-[var(--ink)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 uppercase">
          <span>GESTUREDECK // SONICHUD CONTROLLER</span>
          <span>LOCAL VISION • MEDIAPIPE • FASTAPI • NEXT.JS</span>
          <span>(C)2026 // OPEN SOURCE MIT</span>
        </div>
      </footer>
    </div>
  );
}
