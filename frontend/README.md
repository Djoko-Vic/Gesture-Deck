# GestureDeck Frontend (Next.js + Studio HUD)

The frontend for GestureDeck is built with Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS, Framer Motion animations, and the Web Audio API.

For the comprehensive end-to-end setup and architecture guide, see the root [README.md](../README.md).

---

## Routes & Pages

- **`/` (Landing & Interactive Welcome Page)**:
  - Technical brutalist poster aesthetics with 8×8 Bayer ordered dither hand canvas.
  - Jacquard 24 blackletter and Archivo ExtraCondensed typography.
  - Infinite technical marquee ticker and fluid scroll reveals.
  - **Interactive YouTube Pinch & Drag Simulator**: Live interactive sandbox to test finger gap thresholds and scrubbing mechanics before launching the camera.

- **`/app` (Studio HUD Dashboard)**:
  - Inverted theme live dashboard streaming 21-landmark skeleton telemetry at 30 FPS over WebSocket (`ws://localhost:8000/ws`).
  - Powers on the webcam hardware upon connection; shuts it off upon closing.
  - Segmented confidence gate ($\ge 75\%$), hold confirm charging meter, and live pinch gap telemetry.
  - **Live Media Target Bar**: View and select the active media player or video title (via D-Bus MPRIS).
  - **Safety Clutch Indicator**: Shows whether commands are interlocked or active.
  - **Settings Modal**: Interactive tuning sliders for pinch thresholds (`pinch_on`, `pinch_off`), confirm/release buffers, deadzones, and one-click factory reset.
  - **Gesture Trainer Studio**: Record 30-frame samples and train custom gestures on-device.

---

## Quick Reference: Gesture Controls

- **Wave to Wake**: Wave right hand ($\ge 3$ reversals) to transition from `SLEEPING` to `ACTIVE`.
- **Play / Pause**: Index Finger straight UP ☝️
- **Next Track**: Peace Sign ✌️ (Index + Middle extended UP in a "V")
- **Previous Track**: Three Fingers ✌️+💍 (Index + Middle + Ring extended UP)
- **Volume Up**: Thumbs Up 👍 (repeats slowly while held)
- **Volume Down**: Thumbs Down 👎 (repeats slowly while held)
- **YouTube Timeline Scrub**: Disengage safety clutch with left hand, pinch thumb + index ($\le 0.40$), drag left/right ($\pm 45\text{s}$), release to commit.
- **Standby Sleep**: Closed Fist ✊ held for 1.0 second.

---

## Running the Frontend

To run the frontend alone:
```bash
npm run dev
```

To run both backend and frontend concurrently:
```bash
./run_dev.sh
```
