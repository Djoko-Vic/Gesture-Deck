"use client";

import React, { useRef, useEffect } from "react";
import { HandData } from "../lib/types";

interface HandCanvasProps {
  hands: HandData[];
  isPinch: boolean;
  pinchDistance: number;
  isScrubbing: boolean;
  scrubDelta: number;
  clutchEngaged: boolean;
  activeGesture: string;
  fps?: number;
  cameraType?: string;
}

const BONE_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Knuckle bridge
  [5, 9], [9, 13], [13, 17],
];

export const HandCanvas: React.FC<HandCanvasProps> = ({
  hands,
  isPinch,
  pinchDistance,
  isScrubbing,
  scrubDelta,
  clutchEngaged,
  activeGesture,
  fps = 0,
  cameraType = "webcam",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Inverted Black Ground (--ink #0B0B0B)
    ctx.fillStyle = "#0B0B0B";
    ctx.fillRect(0, 0, width, height);

    // 2. Faint 1px Technical Grid
    ctx.strokeStyle = "rgba(231, 229, 224, 0.08)";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Technical Corner Crosshairs & Labels
    const pad = 12;
    ctx.strokeStyle = "rgba(231, 229, 224, 0.4)";
    ctx.lineWidth = 1;

    // Corner brackets
    const bLen = 14;
    // TL
    ctx.beginPath();
    ctx.moveTo(pad, pad + bLen);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + bLen, pad);
    ctx.stroke();
    // TR
    ctx.beginPath();
    ctx.moveTo(width - pad - bLen, pad);
    ctx.lineTo(width - pad, pad);
    ctx.lineTo(width - pad, pad + bLen);
    ctx.stroke();
    // BL
    ctx.beginPath();
    ctx.moveTo(pad, height - pad - bLen);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(pad + bLen, height - pad);
    ctx.stroke();
    // BR
    ctx.beginPath();
    ctx.moveTo(width - pad - bLen, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad, height - pad - bLen);
    ctx.stroke();

    // 4. If no hands detected, show square pixel scan target
    if (hands.length === 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(231, 229, 224, 0.3)";
      ctx.lineWidth = 1;
      const s = 60;
      ctx.strokeRect(width / 2 - s / 2, height / 2 - s / 2, s, s);

      ctx.fillStyle = "#9B9A96";
      ctx.font = "10px Martian Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("SCANNING // NO TARGET IN FRAME", width / 2, height / 2 + 55);
      ctx.restore();
    }

    // 5. Draw Skeleton: Thin 1px lines + Square pixel dots
    hands.forEach((hand) => {
      const isRight = hand.handedness === "Right";
      const lms = hand.landmarks;
      if (!lms || lms.length < 21) return;

      const jointColor = isRight
        ? "#E7E5E0" // Off-white for controller
        : clutchEngaged
        ? "#1E6B3E" // Technical Green when clutch engaged
        : "#9B9A96"; // Dim Grey when disengaged

      const boneColor = isRight
        ? "rgba(231, 229, 224, 0.45)"
        : clutchEngaged
        ? "rgba(30, 107, 62, 0.55)"
        : "rgba(155, 154, 150, 0.25)";

      // Draw bone linkages (sharp 1px lines)
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = boneColor;
      BONE_CONNECTIONS.forEach(([i1, i2]) => {
        const p1 = lms[i1];
        const p2 = lms[i2];
        if (!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(Math.round(p1.x * width), Math.round(p1.y * height));
        ctx.lineTo(Math.round(p2.x * width), Math.round(p2.y * height));
        ctx.stroke();
      });
      ctx.restore();

      // Draw joints as square pixel blocks
      lms.forEach((pt, idx) => {
        const x = Math.round(pt.x * width);
        const y = Math.round(pt.y * height);
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const sqSize = isTip ? 7 : idx === 0 ? 8 : 5;

        // Accent index tip red on right hand
        if (isRight && idx === 8) {
          ctx.fillStyle = "#E5322B"; // Red accent
        } else {
          ctx.fillStyle = jointColor;
        }

        ctx.fillRect(
          x - Math.floor(sqSize / 2),
          y - Math.floor(sqSize / 2),
          sqSize,
          sqSize
        );
      });

      // Hand spec caption near wrist
      const wrist = lms[0];
      if (wrist) {
        const wx = Math.round(wrist.x * width);
        const wy = Math.round(wrist.y * height) + 18;

        ctx.save();
        ctx.fillStyle = "#0B0B0B";
        ctx.strokeStyle = jointColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(wx - 42, wy - 8, 84, 16);
        ctx.fillRect(wx - 42, wy - 8, 84, 16);

        ctx.fillStyle = jointColor;
        ctx.font = "9px Martian Mono, monospace";
        ctx.textAlign = "center";
        const tag = isRight ? "R // CMD" : clutchEngaged ? "L // CLUTCH:ON" : "L // CLUTCH:OFF";
        ctx.fillText(tag, wx, wy + 4);
        ctx.restore();
      }

      // Pinch Reticle on Right Hand
      if (isRight) {
        const thumbTip = lms[4];
        const indexTip = lms[8];
        if (thumbTip && indexTip) {
          const tx = Math.round(thumbTip.x * width);
          const ty = Math.round(thumbTip.y * height);
          const ix = Math.round(indexTip.x * width);
          const iy = Math.round(indexTip.y * height);
          const mx = Math.round((tx + ix) / 2);
          const my = Math.round((ty + iy) / 2);

          // 1px dashed connecting vector
          ctx.save();
          ctx.lineWidth = 1;
          ctx.strokeStyle = isPinch ? "#E5322B" : "rgba(231, 229, 224, 0.4)";
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(ix, iy);
          ctx.stroke();
          ctx.restore();

          // Square target box at midpoint
          ctx.save();
          ctx.strokeStyle = isPinch ? "#E5322B" : "#9B9A96";
          ctx.lineWidth = 1;
          const boxS = isPinch ? 16 : 10;
          ctx.strokeRect(mx - boxS / 2, my - boxS / 2, boxS, boxS);

          if (isPinch) {
            ctx.fillStyle = "#E5322B";
            ctx.font = "9px Martian Mono, monospace";
            ctx.textAlign = "center";
            ctx.fillText("PINCH LOCKED", mx, my - 14);
          }
          ctx.restore();
        }
      }
    });

    // 6. Scrub Timeline Spec Overlay
    if (isScrubbing) {
      ctx.save();
      const cx = width / 2;
      const cy = height - 45;
      const barW = Math.min(width - 50, 320);

      ctx.fillStyle = "#0B0B0B";
      ctx.strokeStyle = "#E7E5E0";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - barW / 2, cy - 16, barW, 32);
      ctx.fillRect(cx - barW / 2, cy - 16, barW, 32);

      // Technical tick marks
      const ticks = 17;
      const step = (barW - 24) / (ticks - 1);
      for (let i = 0; i < ticks; i++) {
        const tx = cx - (barW - 24) / 2 + i * step;
        const isCenter = i === 8;
        ctx.beginPath();
        ctx.moveTo(tx, cy - (isCenter ? 10 : 5));
        ctx.lineTo(tx, cy + (isCenter ? 10 : 5));
        ctx.stroke();
      }

      // Slider position
      const maxDelta = 45.0;
      const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, scrubDelta));
      const ratio = clampedDelta / maxDelta;
      const sliderX = cx + ratio * ((barW - 24) / 2);

      ctx.fillStyle = "#E5322B";
      ctx.fillRect(sliderX - 3, cy - 8, 6, 16);

      ctx.fillStyle = "#E7E5E0";
      ctx.font = "10px Martian Mono, monospace";
      ctx.textAlign = "center";
      const sign = scrubDelta > 0 ? "+" : "";
      ctx.fillText(`SCRUB SEEK: ${sign}${scrubDelta.toFixed(1)}S (RELEASE TO COMMIT)`, cx, cy - 24);
      ctx.restore();
    }

    // 7. Top Spec Header
    ctx.save();
    ctx.fillStyle = "#9B9A96";
    ctx.font = "10px Martian Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SOURCE: ${cameraType.toUpperCase()} // ${fps} FPS`, pad + 6, pad + 12);

    ctx.textAlign = "right";
    ctx.fillText(`POSE: ${activeGesture.toUpperCase()}`, width - pad - 6, pad + 12);
    ctx.restore();
  }, [hands, isPinch, pinchDistance, isScrubbing, scrubDelta, clutchEngaged, activeGesture, fps, cameraType]);

  return (
    <div className="relative w-full aspect-[4/3] max-h-[520px] border border-[var(--ink)] bg-[#0B0B0B] p-1">
      <canvas ref={canvasRef} className="w-full h-full pixelated block" />
    </div>
  );
};
