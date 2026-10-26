# RemoteControl — GestureDeck for YouTube

Direct DOM visual scrubber click-and-drag, site-only volume control, and bulletproof next/previous video navigation for YouTube.

---

## ⚡ Option 1: Instant "RemoteControl" Bookmarklet (Zero-Install)

The fastest one-click way to connect any YouTube video tab without installing anything:

1. In Brave or Chrome, show your bookmarks bar (`Ctrl + Shift + B`).
2. Add a new bookmark:
   - **Name**: `RemoteControl`
   - **URL**: Copy the code from [`extension/bookmarklet.txt`](bookmarklet.txt) (or click the drag button in the Studio HUD modal).
3. Open any video on YouTube (e.g. `https://www.youtube.com/watch?v=...`).
4. Click your **RemoteControl** bookmark!
5. A glowing green badge (**RemoteControl Ready**) immediately appears in the bottom-right of YouTube.

---

## ⚡ Option 2: 2-Second Console Paste (Immediate Test)

Want to connect your currently open YouTube tab right now in 2 seconds?

1. On your YouTube tab, press **`F12`** (or right-click anywhere → **Inspect**).
2. Click the **Console** tab.
3. Open the Studio HUD (`http://localhost:3000/app`), click **`[ REMOTECONTROL ]`** and click **`COPY CONSOLE SCRIPT`**.
4. Paste into the YouTube Console and press **Enter**!
5. **RemoteControl Connected** will appear right on the video.

---

## 🚀 Option 3: Browser Extension (Runs Automatically)

To make it automatically activate on every YouTube video you open:

1. Open Brave / Chrome:
   - **Brave**: navigate to `brave://extensions`
   - **Chrome**: navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` folder:
   ```
   /home/djokov1c/Proj/yt-hand-tracker/extension
   ```
5. Done! RemoteControl will now run automatically on every YouTube tab.

---

## 🎯 What it unlocks:

- **Pinch & Drag Scrubber**: Visually clicks and drags the red progress bar and scrubber handle across the screen in real time with thumbnail frame previews, just like a physical mouse drag!
- **Site-Only Volume**: Changes in-player volume directly (`0% - 100%`) without ever modifying host system volume.
- **Peace Sign (Next)**: Smoothly advances to the next video, automatically clicking the top recommendation if viewing a standalone video.
- **Three Fingers (Previous)**: Restarts current video from `0:00` or navigates to previous video.
- **Open Palm / Fist (Play/Pause)**: Toggles player playback state.
