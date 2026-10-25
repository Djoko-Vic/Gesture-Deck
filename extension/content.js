/**
 * GestureDeck YouTube Bridge - Content Script
 * Provides direct DOM visual click-and-drag scrubbing, site-only volume control,
 * and reliable next/previous navigation for GestureDeck.
 */

(function () {
  if (window.__GESTUREDECK_BRIDGE_LOADED__) {
    console.log("[GestureDeck] Bridge already active.");
    return;
  }
  window.__GESTUREDECK_BRIDGE_LOADED__ = true;

  console.log("%c[GestureDeck] YouTube Bridge initializing...", "color: #06b6d4; font-weight: bold;");

  const WS_URL = "ws://localhost:8000/ws";
  let socket = null;
  let reconnectTimer = null;
  let isConnected = false;

  // Drag state
  let isDragging = false;
  let dragStartVideoTime = 0;
  let dragVideoDuration = 1;
  let lastTargetTime = 0;

  // DOM Elements cache
  function getPlayer() {
    return document.getElementById("movie_player");
  }

  function getVideo() {
    return document.querySelector("video.html5-main-video") || document.querySelector("video");
  }

  function getProgressBar() {
    return document.querySelector(".ytp-progress-bar");
  }

  function getScrubber() {
    return document.querySelector(".ytp-scrubber-container");
  }

  function getPlayProgress() {
    return document.querySelector(".ytp-play-progress");
  }

  function getTooltip() {
    return document.querySelector(".ytp-tooltip");
  }

  function getTooltipText() {
    return document.querySelector(".ytp-tooltip-text");
  }

  // -------------------------------------------------------------------------
  // On-Screen Floating HUD & Notifications
  // -------------------------------------------------------------------------
  const overlayContainer = document.createElement("div");
  overlayContainer.id = "gesturedeck-yt-hud";
  overlayContainer.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999999;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    user-select: none;
  `;

  // Status Pill
  const statusPill = document.createElement("div");
  statusPill.id = "gesturedeck-status-pill";
  statusPill.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #94a3b8;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0.8;
  `;
  statusPill.innerHTML = `
    <span id="gesturedeck-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px #ef4444; transition: all 0.3s ease;"></span>
    <span id="gesturedeck-label">GestureDeck Disconnected</span>
  `;

  // Action Notification Banner (Volume / Next / Prev / Scrub)
  const actionBanner = document.createElement("div");
  actionBanner.id = "gesturedeck-action-banner";
  actionBanner.style.cssText = `
    display: none;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border-radius: 14px;
    background: rgba(10, 15, 30, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(6, 182, 212, 0.35);
    color: #f8fafc;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.2);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
    transform: translateY(10px) scale(0.96);
    opacity: 0;
  `;

  overlayContainer.appendChild(actionBanner);
  overlayContainer.appendChild(statusPill);

  function attachOverlay() {
    if (!document.getElementById("gesturedeck-yt-hud") && document.body) {
      document.body.appendChild(overlayContainer);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachOverlay);
  } else {
    attachOverlay();
  }

  let bannerTimer = null;
  function showToast(contentHtml, durationMs = 1500) {
    attachOverlay();
    actionBanner.innerHTML = contentHtml;
    actionBanner.style.display = "flex";
    requestAnimationFrame(() => {
      actionBanner.style.transform = "translateY(0) scale(1)";
      actionBanner.style.opacity = "1";
    });

    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      actionBanner.style.transform = "translateY(8px) scale(0.96)";
      actionBanner.style.opacity = "0";
      setTimeout(() => {
        if (actionBanner.style.opacity === "0") {
          actionBanner.style.display = "none";
        }
      }, 200);
    }, durationMs);
  }

  function updateStatus(connected) {
    isConnected = connected;
    const dot = document.getElementById("gesturedeck-dot");
    const label = document.getElementById("gesturedeck-label");
    if (!dot || !label) return;

    if (connected) {
      dot.style.background = "#10b981";
      dot.style.boxShadow = "0 0 10px #10b981";
      label.textContent = "GestureDeck Ready";
      statusPill.style.borderColor = "rgba(16, 185, 129, 0.3)";
      statusPill.style.color = "#a7f3d0";
      setTimeout(() => {
        if (isConnected) statusPill.style.opacity = "0.35";
      }, 3000);
    } else {
      dot.style.background = "#ef4444";
      dot.style.boxShadow = "0 0 8px #ef4444";
      label.textContent = "GestureDeck Reconnecting...";
      statusPill.style.borderColor = "rgba(239, 68, 68, 0.3)";
      statusPill.style.color = "#fca5a5";
      statusPill.style.opacity = "0.9";
    }
  }

  function formatSeconds(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remM = m % 60;
      return `${h}:${remM < 10 ? "0" : ""}${remM}:${rem < 10 ? "0" : ""}${rem}`;
    }
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  }

  // -------------------------------------------------------------------------
  // Media Control Actions (Site-Only Volume, Next, Prev, Play/Pause)
  // -------------------------------------------------------------------------

  function handleVolume(deltaPercent) {
    const player = getPlayer();
    const video = getVideo();

    let newVol = 100;
    if (player && typeof player.getVolume === "function") {
      const current = player.getVolume();
      newVol = Math.max(0, Math.min(100, Math.round(current + deltaPercent)));
      player.setVolume(newVol);
      if (player.isMuted() && deltaPercent > 0) {
        player.unMute();
      }
    } else if (video) {
      const current = Math.round(video.volume * 100);
      newVol = Math.max(0, Math.min(100, Math.round(current + deltaPercent)));
      video.volume = newVol / 100;
      if (video.muted && deltaPercent > 0) {
        video.muted = false;
      }
    }

    const icon = newVol === 0 ? "🔇" : newVol < 50 ? "🔉" : "🔊";
    showToast(`
      <span style="font-size: 18px;">${icon}</span>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Site Volume</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 100px; height: 6px; background: rgba(255,255,255,0.15); border-radius: 999px; overflow: hidden;">
            <div style="width: ${newVol}%; height: 100%; background: linear-gradient(90deg, #06b6d4, #3b82f6); border-radius: 999px;"></div>
          </div>
          <span style="color: #06b6d4; font-size: 13px; font-weight: 800; min-width: 32px;">${newVol}%</span>
        </div>
      </div>
    `, 1200);
  }

  function handleNext() {
    const player = getPlayer();

    // 1. If in a playlist or queue, movie_player.nextVideo() advances smoothly
    if (player && typeof player.nextVideo === "function") {
      try {
        player.nextVideo();
      } catch (e) {}
    }

    // 2. Click the YouTube player native next button if active
    const nextBtn = document.querySelector(".ytp-next-button");
    if (nextBtn && !nextBtn.hasAttribute("aria-disabled") && nextBtn.offsetParent !== null) {
      nextBtn.click();
      showToast(`<span style="font-size: 18px;">⏭</span><span>Next Video</span>`, 1500);
      return;
    }

    // 3. For standalone videos (like watch?v=... with autoplay off), navigate to first recommendation!
    const recCandidates = [
      "ytd-compact-video-renderer a#thumbnail",
      "ytd-rich-item-renderer a#thumbnail",
      "#related ytd-compact-video-renderer a#thumbnail",
      "ytd-watch-next-secondary-results-renderer a#thumbnail",
      "#items ytd-compact-video-renderer a.yt-simple-endpoint",
    ];

    for (const sel of recCandidates) {
      const link = document.querySelector(sel);
      if (link && link.href && link.href.includes("watch?v=")) {
        const titleElem = link.closest("ytd-compact-video-renderer, ytd-rich-item-renderer")?.querySelector("#video-title");
        const nextTitle = titleElem ? titleElem.textContent.trim() : "Next Recommended Video";
        showToast(`<span style="font-size: 18px;">⏭</span><span>Next: ${nextTitle.slice(0, 32)}...</span>`, 2000);
        link.click();
        return;
      }
    }

    showToast(`<span style="font-size: 18px;">⏭</span><span>Next Video Triggered</span>`, 1500);
  }

  function handlePrevious() {
    const player = getPlayer();
    const video = getVideo();
    const currTime = video ? video.currentTime : 0;

    // Standard media player behavior:
    // If playing for > 3 seconds, restart current track from 0:00!
    if (currTime > 3.0) {
      if (player && typeof player.seekTo === "function") {
        player.seekTo(0, true);
      } else if (video) {
        video.currentTime = 0;
      }
      showToast(`<span style="font-size: 18px;">⏮</span><span>Restarted from 0:00</span>`, 1500);
      return;
    }

    // If already at beginning (<= 3s), navigate to previous track or back in history
    if (player && typeof player.previousVideo === "function") {
      try {
        player.previousVideo();
        showToast(`<span style="font-size: 18px;">⏮</span><span>Previous Video</span>`, 1500);
        return;
      } catch (e) {}
    }

    const prevBtn = document.querySelector(".ytp-prev-button");
    if (prevBtn && !prevBtn.hasAttribute("aria-disabled") && prevBtn.offsetParent !== null) {
      prevBtn.click();
      showToast(`<span style="font-size: 18px;">⏮</span><span>Previous Video</span>`, 1500);
      return;
    }

    // History back
    if (window.history.length > 1) {
      showToast(`<span style="font-size: 18px;">⏮</span><span>Going Back</span>`, 1500);
      window.history.back();
    } else {
      if (video) video.currentTime = 0;
      showToast(`<span style="font-size: 18px;">⏮</span><span>Beginning of Video</span>`, 1500);
    }
  }

  function handlePlayPause() {
    const player = getPlayer();
    const video = getVideo();

    if (player && typeof player.getPlayerState === "function") {
      // 1 = PLAYING, 2 = PAUSED
      const state = player.getPlayerState();
      if (state === 1) {
        player.pauseVideo();
        showToast(`<span style="font-size: 18px;">⏸</span><span>Paused</span>`, 1200);
      } else {
        player.playVideo();
        showToast(`<span style="font-size: 18px;">▶</span><span>Playing</span>`, 1200);
      }
    } else if (video) {
      if (video.paused) {
        video.play();
        showToast(`<span style="font-size: 18px;">▶</span><span>Playing</span>`, 1200);
      } else {
        video.pause();
        showToast(`<span style="font-size: 18px;">⏸</span><span>Paused</span>`, 1200);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Visual Scrubber Click & Drag Engine (Pinch & Drag)
  // -------------------------------------------------------------------------

  function startScrub() {
    const video = getVideo();
    const bar = getProgressBar();
    if (!video || !bar) return;

    isDragging = true;
    dragStartVideoTime = video.currentTime;
    dragVideoDuration = Math.max(1, video.duration || 1);
    lastTargetTime = dragStartVideoTime;

    const rect = bar.getBoundingClientRect();
    const currentRatio = dragStartVideoTime / dragVideoDuration;
    const clientX = rect.left + currentRatio * rect.width;
    const clientY = rect.top + rect.height / 2;

    // Dispatch PointerDown and MouseDown on the YouTube progress bar
    try {
      const downEvent = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: clientX,
        clientY: clientY,
        pointerId: 1,
        pointerType: "mouse",
        buttons: 1,
        isPrimary: true,
      });
      bar.dispatchEvent(downEvent);
      bar.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX, clientY, buttons: 1 }));
    } catch (e) {}

    // Add dragging classes to show player controls & scrubber
    const player = getPlayer();
    if (player) {
      player.classList.add("ytp-dragging");
      player.classList.remove("ytp-autohide");
    }

    statusPill.style.opacity = "1";
    statusPill.style.borderColor = "rgba(6, 182, 212, 0.6)";
  }

  function updateScrub(deltaSeconds) {
    const video = getVideo();
    const player = getPlayer();
    const bar = getProgressBar();
    const scrubber = getScrubber();
    const playProgress = getPlayProgress();
    const tooltip = getTooltip();
    const tooltipText = getTooltipText();
    if (!video || !bar) return;

    const targetTime = Math.max(0, Math.min(dragVideoDuration, dragStartVideoTime + deltaSeconds));
    lastTargetTime = targetTime;
    const targetRatio = targetTime / dragVideoDuration;

    const rect = bar.getBoundingClientRect();
    const clientX = rect.left + targetRatio * rect.width;
    const clientY = rect.top + rect.height / 2;

    // 1. Dispatch PointerMove and MouseMove to YouTube listeners
    try {
      const moveEvent = new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: clientX,
        clientY: clientY,
        pointerId: 1,
        pointerType: "mouse",
        buttons: 1,
        isPrimary: true,
      });
      bar.dispatchEvent(moveEvent);
      window.dispatchEvent(moveEvent);
      bar.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX, clientY, buttons: 1 }));
    } catch (e) {}

    // 2. Direct DOM Styling: physically slide the red scrubber knob and fill
    const progressWidthPx = targetRatio * rect.width;
    if (scrubber) {
      scrubber.style.transform = `translateX(${progressWidthPx}px)`;
    }
    if (playProgress) {
      playProgress.style.transform = `scaleX(${targetRatio})`;
    }

    // 3. Update preview tooltip position and time text
    if (tooltip) {
      tooltip.style.display = "block";
      tooltip.style.left = `${clientX}px`;
      tooltip.classList.remove("ytp-tooltip-hidden");
    }
    if (tooltipText) {
      const sign = deltaSeconds >= 0 ? "+" : "";
      tooltipText.textContent = `${formatSeconds(targetTime)} (${sign}${Math.round(deltaSeconds)}s)`;
    }

    // 4. Seek video preview frame in real-time (allowSeekAhead = false keeps it smooth without buffering hang)
    if (player && typeof player.seekTo === "function") {
      try {
        player.seekTo(targetTime, false);
      } catch (e) {}
    }

    // 5. On-Screen HUD feedback
    const sign = deltaSeconds >= 0 ? "+" : "";
    const scrubHtml = `
      <span style="font-size: 18px; color: #06b6d4;">⟷</span>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <div style="display: flex; align-items: baseline; gap: 6px;">
          <span style="font-size: 15px; font-weight: 800; color: #ffffff;">${formatSeconds(targetTime)}</span>
          <span style="font-size: 12px; color: #64748b;">/ ${formatSeconds(dragVideoDuration)}</span>
          <span style="font-size: 12px; font-weight: 800; color: #06b6d4; margin-left: 4px;">(${sign}${Math.round(deltaSeconds)}s)</span>
        </div>
        <span style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Pinch & Drag Active</span>
      </div>
    `;
    showToast(scrubHtml, 1500);
  }

  function commitScrub() {
    if (!isDragging) return;
    const player = getPlayer();
    const video = getVideo();
    const bar = getProgressBar();
    const tooltip = getTooltip();

    isDragging = false;

    if (bar) {
      const rect = bar.getBoundingClientRect();
      const targetRatio = lastTargetTime / dragVideoDuration;
      const clientX = rect.left + targetRatio * rect.width;
      const clientY = rect.top + rect.height / 2;

      try {
        const upEvent = new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: clientX,
          clientY: clientY,
          pointerId: 1,
          pointerType: "mouse",
          buttons: 0,
          isPrimary: true,
        });
        bar.dispatchEvent(upEvent);
        window.dispatchEvent(upEvent);
        bar.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX, clientY, buttons: 0 }));
      } catch (e) {}
    }

    // Commit seek with allowSeekAhead = true
    if (player && typeof player.seekTo === "function") {
      player.seekTo(lastTargetTime, true);
    } else if (video) {
      video.currentTime = lastTargetTime;
    }

    // Clean up dragging classes and tooltip
    if (player) {
      player.classList.remove("ytp-dragging");
    }
    if (tooltip) {
      setTimeout(() => {
        tooltip.style.display = "";
      }, 300);
    }

    showToast(`
      <span style="font-size: 18px; color: #10b981;">✓</span>
      <span>Seek committed to <b>${formatSeconds(lastTargetTime)}</b></span>
    `, 1500);

    setTimeout(() => {
      if (isConnected) statusPill.style.opacity = "0.35";
      statusPill.style.borderColor = "rgba(16, 185, 129, 0.3)";
    }, 1500);
  }

  // -------------------------------------------------------------------------
  // WebSocket Communication with GestureDeck Core
  // -------------------------------------------------------------------------

  function connect() {
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      socket = new WebSocket(WS_URL);
    } catch (err) {
      console.warn("[GestureDeck] WebSocket connection error:", err);
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      console.log("%c[GestureDeck] Connected to backend!", "color: #10b981; font-weight: bold;");
      updateStatus(true);

      // Register this client as the YouTube Bridge
      socket.send(
        JSON.stringify({
          type: "register",
          client: "youtube_bridge",
          title: document.title,
          url: window.location.href,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 1. Telemetry stream for real-time pinch-and-drag
        if (data.type === "telemetry" && data.scrub) {
          const scrub = data.scrub;
          if (scrub.is_scrubbing) {
            if (!isDragging) {
              startScrub();
            }
            updateScrub(scrub.delta_seconds || 0);
          } else {
            if (isDragging) {
              commitScrub();
            }
          }
        }

        // 2. Explicit action events (triggered by gesture, HUD buttons, or API)
        const actionEvt = data.type === "action_event" ? data.event : (data.action_event || null);
        if (actionEvt && actionEvt.action) {
          const act = actionEvt.action;
          const params = actionEvt.params || {};

          if (act === "volume_up") {
            handleVolume(5);
          } else if (act === "volume_down") {
            handleVolume(-5);
          } else if (act === "next") {
            handleNext();
          } else if (act === "previous") {
            handlePrevious();
          } else if (act === "play_pause") {
            handlePlayPause();
          } else if (act === "seek_delta") {
            const delta = params.delta_seconds || 0;
            if (Math.abs(delta) >= 1.0) {
              const video = getVideo();
              const player = getPlayer();
              if (video) {
                const target = Math.max(0, Math.min(video.duration || 1, video.currentTime + delta));
                if (player && typeof player.seekTo === "function") {
                  player.seekTo(target, true);
                } else {
                  video.currentTime = target;
                }
                const sign = delta >= 0 ? "+" : "";
                showToast(`<span>Seek ${sign}${Math.round(delta)}s</span>`, 1200);
              }
            }
          }
        }
      } catch (err) {
        console.error("[GestureDeck] Error parsing message:", err);
      }
    };

    socket.onclose = () => {
      updateStatus(false);
      if (isDragging) {
        commitScrub();
      }
      scheduleReconnect();
    };

    socket.onerror = () => {
      updateStatus(false);
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 2000);
  }

  // Start connection
  connect();

  // Watch for page navigation within YouTube SPA
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "bridge_hello",
            client: "youtube_bridge",
            title: document.title,
            url: window.location.href,
          })
        );
      }
    }
  });
  urlObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
