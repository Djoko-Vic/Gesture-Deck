# GestureDeck — SonicHUD Hand-Gesture Media Controller

> **Touchless, zero-cloud media controller for YouTube, Spotify, and system players.**  
> Powered by Python (FastAPI + OpenCV + MediaPipe Tasks) and Next.js (TypeScript + Turbopack + WebAudio procedural sound synthesis).

---

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Key Features](#2-key-features)
3. [Quickstart & Installation](#3-quickstart--installation)
4. [Step-by-Step User Guide](#4-step-by-step-user-guide)
   - [Step 1: Launch the System](#step-1-launch-the-system)
   - [Step 2: Explore the Interactive Welcome Page](#step-2-explore-the-interactive-welcome-page)
   - [Step 3: Launch the Studio HUD](#step-3-launch-the-studio-hud)
   - [Step 4: Wake the Controller](#step-4-wake-the-controller)
   - [Step 5: Control Playback with Gestures](#step-5-control-playback-with-gestures)
   - [Step 6: Scrub YouTube Videos with Pinch & Drag](#step-6-scrub-youtube-videos-with-pinch--drag)
   - [Step 7: Target Specific Sites & Media Players](#step-7-target-specific-sites--media-players)
   - [Step 8: Tune Sensitivity & Gesture Buffers](#step-8-tune-sensitivity--gesture-buffers)
   - [Step 9: Train Custom Hand Gestures](#step-9-train-custom-hand-gestures)
5. [Complete Gesture Taxonomy](#5-complete-gesture-taxonomy)
6. [How Pinch & Drag Works for YouTube Videos](#6-how-pinch--drag-works-for-youtube-videos)
7. [Context Profiles & Dispatch Modes](#7-context-profiles--dispatch-modes)
8. [Safety Architecture & Accidental Trigger Immunity](#8-safety-architecture--accidental-trigger-immunity)
9. [Running Automated Tests](#9-running-automated-tests)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)
11. [License](#11-license)

---

## 1. Overview & Architecture

GestureDeck is an air-gesture media controller that runs entirely on your local machine. It allows you to play, pause, skip tracks, adjust volume, and scrub video timelines with natural hand gestures in front of your webcam.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          LOCAL SYSTEM ARCHITECTURE                     │
│                                                                        │
│   Webcam Frame (30 FPS)                                                │
│         │                                                              │
│         ▼                                                              │
│   [ OpenCV Mirror ] ──► [ MediaPipe Hands ] ──► 21 Landmarks / Hand    │
│                                                       │                │
│                                                       ▼                │
│   [ Dispatcher ] ◄── [ State Machine ] ◄── [ Wrist Normalizer (63-D) ] │
│   (pynput / D-Bus)   (Hysteresis, Buffers)                             │
│         │                                                              │
│         ▼                                                              │
│   OS Media / YouTube / Spotify                                         │
│                                                                        │
│   WebSocket (ws://localhost:8000/ws)                                   │
│         │                                                              │
│         ▼                                                              │
│   [ Next.js Studio HUD (:3000/app) ] ──► [ SonicHUD Procedural Audio ] │
└────────────────────────────────────────────────────────────────────────┘
```

- **Backend (`/backend`)**: Python 3.11+, FastAPI WebSocket server, OpenCV video capture, MediaPipe HandLandmarker, scikit-learn on-device KNN classifier, `pynput` keyboard dispatch, and Linux MPRIS D-Bus integration.
- **Frontend (`/frontend`)**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion animations, Bayer 8×8 dither poster canvas, and procedural WebAudio synthesis.
- **Zero Cloud**: Raw video frames stay in RAM, are processed locally, and are immediately discarded. Only numerical landmark coordinates stream across local loopback (`ws://localhost:8000/ws`).
- **Camera On-Demand**: The webcam hardware remains **powered off in standby** when the app launches and only activates when an active HUD session opens. Closing the HUD releases the hardware device immediately.

---

## 2. Key Features

- **Pinch & Drag Video Scrubbing**: Scrub YouTube and media players forward or backward ($\pm 45\text{s}$) by pinching thumb and index together and moving horizontally.
- **Relaxed Easy-Grab Hysteresis**: Boosted pinch threshold ($0.40$) for effortless grabbing with hysteresis hold ($0.55$) to prevent accidental drops mid-drag.
- **Dual-Hand Safety Clutch**: Prevents accidental actions while moving around or touching your face. Actions only fire when the left hand disengages the clutch.
- **Site-Specific Dispatch**: Automatically adapts keyboard commands for YouTube (`k`, `Shift+N`, `Shift+P`, `j`/`l`), Spotify (Desktop & Web API), or generic media players.
- **Active Video Inspection Switch**: Protects privacy by leaving window/tab title inspection disabled until switched on by the user.
- **On-Device ML Gesture Trainer**: Record 30 frames of any custom hand pose and train an on-device scikit-learn model with $<0.5\text{ms}$ prediction latency.
- **SonicHUD Procedural Audio**: Generates synthesized mechanical clicks, ascending wake arpeggios, and timeline scrub ticks via the Web Audio API without loading audio files.

---

## 3. Quickstart & Installation

### Prerequisites
- **Operating System**: Linux, macOS, or Windows
- **Python**: 3.11+
- **Node.js**: 18+ and `npm`
- **Webcam**: Standard USB or integrated webcam

### 1-Line Quickstart (Recommended)
Clone the repository and run the unified launcher script:
```bash
./run_dev.sh
```
This script automatically:
1. Detects or initializes the Python virtual environment (`backend/venv`).
2. Installs backend dependencies (`pip install -r backend/requirements.txt`).
3. Installs frontend dependencies (`npm install`).
4. Concurrently launches FastAPI on `http://localhost:8000` and Next.js on `http://localhost:3000`.

### Manual Step-by-Step Setup

#### Backend Setup
```bash
cd backend
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
./venv/bin/python run.py
```
*FastAPI server will listen on `http://localhost:8000`.*

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Next.js will serve the UI on `http://localhost:3000`.*

---

## 4. Step-by-Step User Guide

### Step 1: Launch the System
Run `./run_dev.sh`. Verify both processes are healthy:
- Backend: Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
- Frontend: Open [http://localhost:3000](http://localhost:3000).

---

### Step 2: Explore the Interactive Welcome Page
Visit [`http://localhost:3000`](http://localhost:3000):
- **Hero Banner**: Displays 30 FPS local pipeline indicators, Bayer-dithered artwork, and fluid animations.
- **Interactive Ticker**: Features real-time specifications and architecture highlights.
- **YouTube Pinch & Drag Simulator**: Use the interactive sandbox on the welcome page to test how finger gap distances, clutch toggles, and horizontal sweeps seek video playback.

---

### Step 3: Launch the Studio HUD
Click **`LAUNCH STUDIO HUD →`** or navigate directly to:
```
http://localhost:3000/app
```
1. **Camera Starts Automatically**: As soon as the HUD establishes a WebSocket connection, the backend powers on the camera.
2. **Review Status Cards**:
   - **`01 // STATE`**: Starts in `SLEEPING` mode.
   - **`02 // CLUTCH`**: Shows `ARMED` (when left palm is open) or `LOCKED`.
   - **`03 // SCRUB`**: Displays timeline scrub status (`STANDBY` or `ACTIVE`).
   - **`CONFIDENCE GATE`**: Displays MediaPipe model certainty (requires $\ge 75\%$).

---

### Step 4: Wake the Controller
By default, GestureDeck begins in **`SLEEPING`** standby to prevent unintended commands.

1. Raise your **right hand** with your palm facing the camera.
2. **Wave side-to-side**: Make at least 3 distinct directional reversals across 1 second.
3. You will hear an ascending arpeggio chime and `01 // STATE` will change to `ACTIVE`.
4. **1500ms Grace Period**: For 1.5 seconds immediately after waking, commands are locked out to ensure the finishing motion of your wave doesn't trigger any media action.

---

### Step 5: Control Playback with Gestures
Ensure the **Safety Clutch** is armed (hold your **Left Hand** in an open palm pose, or disable clutch in Settings). Perform these gestures with your **Right Hand**:

- **Play / Pause**: Extend your **Index Finger straight UP** ☝️ (middle, ring, and pinky folded).
- **Next Track**: Make a **Peace Sign** ✌️ (index and middle fingers extended UP in a "V", ring and pinky folded).
- **Previous Track**: Make a **Three-Finger Sign** ✌️+💍 (index, middle, and ring fingers extended UP, pinky folded).
- **Volume Up (+6%)**: Give a **Thumbs Up** 👍 (thumb pointing up, four fingers curled). Hold to repeat every 600ms.
- **Volume Down (-6%)**: Give a **Thumbs Down** 👎 (thumb pointing down, four fingers curled). Hold to repeat every 600ms.
- **Standby Sleep**: Extend **Thumb and Pinky** 🤙 (Shaka pose: thumb & pinky extended, index, middle, ring curled) and hold for 1.0 second.

---

### Step 6: Scrub YouTube Videos with Pinch & Drag
To jump forward or backward through a video timeline:

1. **Arm Clutch**: Open your **left palm** towards the camera.
2. **Pinch**: Bring your right **thumb tip** and **index tip** together until they touch.
   - The HUD will beep with a magnetic snap tone and show `SCRUB: ACTIVE`.
   - Your current hand position is locked as the **Anchor Point ($0.0\text{s}$)**.
3. **Drag Left or Right**:
   - Move your hand **left** to scrub backward (up to $-45\text{s}$).
   - Move your hand **right** to scrub forward (up to $+45\text{s}$).
   - The SonicHUD emits micro-ticks and displays the preview delta (e.g., `+25.0S`).
4. **Release to Commit**: Open your fingers. The seek is immediately executed on your YouTube video.

---

### Step 7: Target Specific Sites & Media Players
In the Studio HUD ([http://localhost:3000/app](http://localhost:3000/app)):

1. **Turn On Media Inspection Switch**:
   - By default, media inspection is paused for privacy. Click **`[ TURN ON SWITCH ]`** in the HUD banner.
2. **Select Target Site**:
   - **`AUTO`**: Detects the active window title and dynamically picks the best shortcut profile.
   - **`YOUTUBE`**: Forces YouTube browser shortcuts (`k`, `Shift+N`, `Shift+P`, `j`/`l`).
   - **`SPOTIFY`**: Controls Spotify desktop or Spotify Web API.
   - **`GENERIC`**: Sends standard OS multimedia keys.
3. **Select From Detected Media Targets**:
   - Use the **`TARGET MEDIA`** drop-down to bind GestureDeck directly to an active YouTube video title or Spotify track discovered via Linux D-Bus MPRIS.

---

### Step 8: Tune Sensitivity & Gesture Buffers
Click **`[ CONFIG // SETTINGS ]`** in the Studio HUD:
- **`PINCH GRAB THRESHOLD`** (Default: `0.40`): Higher values make pinching easier to initiate.
- **`PINCH RELEASE (HYSTERESIS)`** (Default: `0.55`): Prevents dropping the scrub prematurely.
- **`CONFIRM WINDOW`** (Default: `350 ms`): Milliseconds a pose must hold continuously before executing (ensures intentional confirmation and eliminates instantaneous accidental triggers).
- **`RELEASE REQUIREMENT`** (Default: `300 ms`): Milliseconds a hand must leave a pose before re-triggering.
- **`DRAG DEADZONE`** (Default: `2.0%`): Deadzone to ignore natural hand tremor.
- **`DRAG SMOOTHING`** (Default: `0.30`): Exponential smoothing coefficient for fluid scrubbing.
- **`[ ↺ RESET TO DEFAULTS ]`**: One-click button to restore factory-tuned settings.

---

### Step 9: Train Custom Hand Gestures
Want to create your own gesture (e.g., "Rock on" 🤘 to open a playlist)?

1. In the Studio HUD, click **`[ + TRAIN GESTURE ]`**.
2. Enter a gesture name (e.g., `rock_on`) and select an action (e.g., `volume_mute`, `play_pause`, `browser_url`).
3. Click **`RECORD (30 SAMPLES)`**.
4. Hold your hand pose in front of the camera while the 30-frame progress bar fills.
5. Click **`TRAIN MODEL`**. GestureDeck normalizes the 21 3D coordinates relative to your wrist and fits a distance-weighted KNN classifier in $<0.5\text{ms}$.

---

---

## 5. Complete Gesture Taxonomy

All command gestures are performed with the **Right Hand** while the controller is in the **ACTIVE** state:

| Gesture Name | Physical Pose | Target Action | Confirmation & Cooldown |
| :--- | :--- | :--- | :--- |
| **Wave to Wake** | Open palm waving side-to-side ($\ge 3$ reversals in 1s) | **Wake Controller** | 1500ms post-wake grace lockout |
| **Play / Pause** | Index finger extended straight UP ☝️ | **Toggle Play / Pause** | 350ms deliberate hold + 800ms cooldown + neutral reset |
| **Next Track** | Peace Sign ✌️ (Index + Middle extended UP in V) | **Next Track / Video** | Direct DOM click on next video or top recommendation; 350ms hold + 1000ms cooldown |
| **Previous Track**| Three Fingers ✌️+💍 (Index + Middle + Ring extended UP) | **Restart (0:00) / Prev** | Restarts video from 0:00 (if >3s) or previous video; 350ms hold + 1000ms cooldown |
| **Volume Up** | Thumbs Up 👍 (Thumb UP, 4 fingers folded) | **Site Volume +5%** | Modifies **only** player/site volume, protecting host OS volume! 250ms hold, repeats ~600ms while held |
| **Volume Down** | Thumbs Down 👎 (Thumb DOWN, 4 fingers folded) | **Site Volume -5%** | Modifies **only** player/site volume, protecting host OS volume! 250ms hold, repeats ~600ms while held |
| **Pinch & Drag** | Thumb tip + Index tip touching ($\le 0.40$ gap) | **Visual Scrubber Drag** | Clicks and drags YouTube's red scrubber handle & thumbnail preview across the screen |
| **Thumb & Pinky** | Extend Thumb & Pinky 🤙 (3 fingers folded) held $\ge 1.0\text{s}$ | **Standby Sleep** | Manual sleep trigger |
| **Open Palm** | All 5 fingers extended facing camera 🖐️ | **Neutral (Safe Pose)** | Safe resting pose after waving |
| **Peace Sign Up**| Index + Middle pointing straight UP | **Neutral (Safe Pose)** | Sway-immune neutral pose |

---

## 6. How Pinch & Drag Works for YouTube Videos

GestureDeck provides **true visual click-and-drag** directly on the YouTube video player:

```
[ Step 1: Clutch Check ]
Left hand held open ──► Safety Interlock Disengaged
                             │
[ Step 2: Proximity Gate ]
Thumb tip to Index tip gap <= 0.40 ──► Trigger Pinch Grab
                             │
[ Step 3: Anchor Lock & MouseDown Simulation ]
Freezes initial X position ──► Dispatches `pointerdown` / `mousedown` on .ytp-progress-bar
                             │
[ Step 4: Real-Time Visual Drag ]
Hand moves left (-45s) or right (+45s) across camera:
 ├── Dispatches `pointermove` across progress bar matching hand pixel coordinates
 ├── Physically translates red knob (.ytp-scrubber-container)
 ├── Slides video preview thumbnail tooltip (.ytp-tooltip)
 └── Calls player.seekTo(targetTime, false) to preview live video frames!
                             │
[ Step 5: Finger Release ]
Gap widens > 0.55 ──► Dispatches `pointerup` / `mouseup` & commits seekTo(targetTime, true)
```

1. **Physical Mouse Emulation**: The moment your fingers pinch, the bridge calculates the exact pixel coordinate on the `.ytp-progress-bar` corresponding to current playback and fires synthetic pointer events (`pointerdown`, `pointermove`, `pointerup`).
2. **Visual Feedback on YouTube**: The red scrubber handle and the preview thumbnail bubble follow your hand across the progress bar, showing the exact timestamp and seek delta (e.g. `+18s`).
3. **No OS Cursor Hijacking**: The mouse drag simulation occurs inside the web page DOM, so your system mouse pointer is never locked, stolen, or moved.
4. **Site-Only Volume Isolation**:
   - Changing volume (Thumbs Up/Down) adjusts the HTML5 `<video>` or `#movie_player` volume directly.
   - Master operating system volume (`Key.media_volume_up/down`) is **never touched**, completely preventing desktop audio spikes!
5. **Smart Standalone Video Navigation**:
   - When viewing standalone YouTube videos (where Autoplay is off and there is no playlist), shortcut keys like `Shift+N` do nothing.
   - GestureDeck detects standalone videos and automatically clicks the top recommended video (`ytd-compact-video-renderer`), ensuring **Next** always works!

---

## 7. RemoteControl YouTube Bridge Setup

To enable physical scrubber dragging, smart video navigation, and site-only volume on YouTube, use any of these zero-friction methods:

### ⚡ Method 1: The `RemoteControl` Bookmarklet (Zero-Install Bookmark)
1. In Brave or Chrome, show your bookmarks bar (`Ctrl + Shift + B`).
2. Open the Studio HUD at [http://localhost:3000/app](http://localhost:3000/app) and click **`[ ⚡ REMOTECONTROL ]`** in the header.
3. Drag the glowing green **`📌 RemoteControl`** button directly to your browser's bookmarks bar!
4. On any YouTube video page, simply click the **`RemoteControl`** bookmark.
5. A neon green badge (**`⚡ REMOTECONTROL READY`**) appears in the bottom-right corner of YouTube.

> **💡 Trusted-Types & CSP Proof:** Modern YouTube enforces strict `TrustedScriptURL` Content Security Policies. The `RemoteControl` bookmarklet is completely self-contained and inline—it executes safely in memory without injecting external `<script>` tags, preventing browser CSP security blocks.

### 📋 Method 2: 2-Second DevTools Console Paste
If you don't use the bookmarks bar:
1. On your YouTube video tab, press **`F12`** (or `Ctrl + Shift + J`) to open Developer Tools.
2. Click **`[ COPY CONSOLE CODE ]`** in the HUD modal (or copy `extension/bookmarklet.txt`).
3. Paste into the Console and press **`Enter`**.
4. The `RemoteControl` bridge connects instantly!

### 🚀 Method 3: `RemoteControl` Extension (Automatic On All YouTube Tabs)
1. Open `brave://extensions` (or `chrome://extensions`).
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/` directory from this project:
   ```
   /home/djokov1c/Proj/yt-hand-tracker/extension
   ```
5. Done! `RemoteControl` runs automatically in the page's main world whenever you visit YouTube.

---

## 8. Safety Architecture & Accidental Trigger Immunity

To eliminate false positives, GestureDeck implements five interlocking safety mechanisms:

1. **Wake Grace Period (`1500 ms`)**: All gesture actions are suppressed for 1.5 seconds immediately after waking up.
2. **Neutral Reset**: After an action fires, the hand must completely leave that pose for $\ge 300\text{ms}$ before it can fire again. Holding a pose will never machine-gun commands.
3. **Action Cooldowns**:
   - Destructive actions (Next/Previous Track): $1000\text{ms}$ cooldown.
   - Volume adjustments: $600\text{ms}$ repeat rate.
4. **Left-Hand Safety Clutch**: Risky actions (such as seeking video timelines) strictly enforce the left-hand open palm requirement.
5. **Rectified Hand Mirroring**: OpenCV horizontally flips the camera feed (`cv2.flip(frame, 1)`). Handedness labels are rectified in software so your physical right hand always corresponds to the on-screen right hand.

---

## 9. Running Automated Tests

Run the full automated test suite (27 unit tests):

```bash
# Run backend pytest suite
./backend/venv/bin/pytest backend/tests/ -v
```

```bash
# Run frontend production build check
cd frontend && npm run build
```

### What the Unit Tests Cover:
- Action dispatcher site-only volume protection and live listeners.
- Wave detector amplitude and directional reversal validation.
- Wrist translation and palm-scale invariant coordinate normalization.
- Pinch distance computation, thresholding, and hysteresis logic.
- Left-hand clutch debounce engagement and hysteresis linger.
- State machine neutral reset and hold-off buffers.
- Window detector and MPRIS media target enumeration.

---

## 10. Troubleshooting & FAQ

### Camera isn't turning on?
- GestureDeck uses **on-demand camera activation**. The camera remains off on startup and powers on only when you open [`http://localhost:3000/app`](http://localhost:3000/app).
- Check your camera device index in Settings (default is index `0`). If using an external USB webcam, try index `1`.

### Commands aren't reaching YouTube?
- Verify that **`SAFETY CLUTCH`** is either satisfied (hold your left hand open in view) or disabled in Settings.
- Make sure the YouTube browser window is active or that your browser supports MPRIS media keys (Chrome and Firefox on Linux support this out of the box).
- Ensure your confidence rating is above the $75\%$ gate by ensuring adequate room lighting.

### Video scrub jumped too far?
- In Settings, lower the **`TIMELINE SCRUB MULTIPLIER`** (e.g. from `1.0X` to `0.6X`) or adjust the **`DRAG DEADZONE`**.

---

## 11. License

This project is licensed under the **MIT License**. Free and open source for personal and commercial use.
