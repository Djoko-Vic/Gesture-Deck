# GestureDeck YouTube Bridge

Direct DOM visual scrubber click-and-drag, site-only volume control, and bulletproof next/previous video navigation for YouTube.

---

## ⚡ Option 1: Instant 1-Click Bookmarklet (Zero Install)

The fastest way to connect YouTube without installing anything:

1. In Brave or Chrome, show the bookmarks bar (`Ctrl + Shift + B`).
2. Add a new bookmark with:
   - **Name**: `GestureDeck Bridge`
   - **URL**:
     ```javascript
     javascript:(function(){if(window.__GESTUREDECK_BRIDGE_LOADED__){console.log('GestureDeck Bridge already loaded.');return;}const s=document.createElement('script');s.src='http://localhost:8000/static/extension/content.js?t='+Date.now();s.onload=function(){console.log('GestureDeck Bridge loaded successfully!');};s.onerror=function(){alert('Could not connect to GestureDeck backend at http://localhost:8000. Please start GestureDeck first!');};document.head.appendChild(s);})();
     ```
3. Open any video on YouTube (e.g. `https://www.youtube.com/watch?v=...`).
4. Click your **GestureDeck Bridge** bookmark!
5. You will immediately see the glowing green pill in the bottom-right: **GestureDeck Ready**.

---

## 🚀 Option 2: Browser Extension (Runs Automatically)

To make it automatically activate on every YouTube video:

1. Open Brave / Chrome:
   - **Brave**: navigate to `brave://extensions`
   - **Chrome**: navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` folder from this repository:
   ```
   /home/djokov1c/Proj/yt-hand-tracker/extension
   ```
5. Done! The bridge will now automatically connect on every YouTube page.

---

## 🎯 What it unlocks:

- **Pinch & Drag Scrubber**: Visually clicks and drags the red progress bar and scrubber handle across the screen in real time with thumbnail frame previews, just like a physical mouse drag!
- **Site-Only Volume**: Changes in-player volume directly (`0% - 100%`) without ever modifying host system volume.
- **Peace Sign (Next)**: Smoothly advances to the next video, automatically clicking the top recommendation if viewing a standalone video.
- **Three Fingers (Previous)**: Restarts current video from `0:00` or navigates to previous video.
- **Open Palm / Fist (Play/Pause)**: Toggles player playback state.
