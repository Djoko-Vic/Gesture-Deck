"use client";

import React, { useRef, useEffect } from "react";

const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export const DitherHandCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 736;
    const height = 414;
    canvas.width = width;
    canvas.height = height;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Load watermark-free halftone reaching hands artwork
    const img = new Image();
    img.src = "/creation_hands_paper.png";

    const renderDirect = () => {
      ctx.fillStyle = "#E7E5E0";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };

    img.onload = () => {
      // Offscreen canvas to sample raw pixel data
      const offCanvas = document.createElement("canvas");
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext("2d");
      if (!offCtx) {
        renderDirect();
        return;
      }

      offCtx.drawImage(img, 0, 0, width, height);
      const imgData = offCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      if (prefersReducedMotion) {
        renderDirect();
        return;
      }

      const pixelSize = 4; // Chunky Bayer pixel size for noise resolve
      const cols = Math.floor(width / pixelSize);
      const rows = Math.floor(height / pixelSize);

      let currentStep = 0;
      const maxSteps = 10;

      const renderDither = (stepProgress: number) => {
        if (stepProgress >= 1.0) {
          renderDirect();
          return;
        }

        ctx.fillStyle = "#E7E5E0";
        ctx.fillRect(0, 0, width, height);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const sx = c * pixelSize + Math.floor(pixelSize / 2);
            const sy = r * pixelSize + Math.floor(pixelSize / 2);
            const idx = (sy * width + sx) * 4;

            // Inverted luminosity (dark dots have high intensity)
            const lum = 255 - data[idx];
            const bayerThreshold = (BAYER_8X8[r % 8][c % 8] / 64) * 255;
            const noise = ((Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1 + 1) * 127.5;
            const effectiveLum = stepProgress * lum + (1 - stepProgress) * noise;

            if (effectiveLum > bayerThreshold + 20) {
              ctx.fillStyle = "#0B0B0B";
              ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
            }
          }
        }
      };

      // Step-by-step resolve from noise into the reaching hands
      const interval = setInterval(() => {
        currentStep++;
        const progress = Math.min(1.0, currentStep / maxSteps);
        renderDither(progress);
        if (currentStep >= maxSteps) {
          clearInterval(interval);
        }
      }, 70);
    };

    // Initial background fill while loading
    ctx.fillStyle = "#E7E5E0";
    ctx.fillRect(0, 0, width, height);
  }, []);

  return (
    <div className="relative w-full max-w-2xl aspect-[736/414] mx-auto border border-[var(--ink)] bg-[var(--paper)] p-2 select-none">
      {/* Registration Marks / Crosshairs */}
      <span className="absolute -top-2.5 -left-2.5 font-mono text-xs text-[var(--ink)] select-none">
        ⌖
      </span>
      <span className="absolute -top-2.5 -right-2.5 font-mono text-xs text-[var(--ink)] select-none">
        ⌖
      </span>
      <span className="absolute -bottom-2.5 -left-2.5 font-mono text-xs text-[var(--ink)] select-none">
        ⌖
      </span>
      <span className="absolute -bottom-2.5 -right-2.5 font-mono text-xs text-[var(--ink)] select-none">
        ⌖
      </span>

      {/* Tiny corner captions in top corners to avoid title overlap */}
      <span className="absolute top-2 left-2 font-mono text-[9px] tracking-widest uppercase text-[var(--grey)] select-none">
        FIG. 01 // HALFTONE DUAL-HAND REPERTOIRE
      </span>
      <span className="absolute top-2 right-2 font-mono text-[9px] tracking-widest uppercase text-[var(--grey)] select-none">
        CAL. 30FPS // LOCAL
      </span>

      <canvas ref={canvasRef} className="w-full h-full pixelated block" />
    </div>
  );
};


