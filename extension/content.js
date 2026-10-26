/**
 * RemoteControl - GestureDeck for YouTube
 * Direct DOM visual click-and-drag scrubbing, site-only volume control,
 * and reliable next/previous navigation for YouTube.
 */

(function () {
  if (window.__REMOTECONTROL_BRIDGE__) {
    console.log("[RemoteControl] Bridge already active - refreshing status...");
    try {
      window.__REMOTECONTROL_BRIDGE__.ping();
    } catch (e) {}
    return;
  }
  window.__REMOTECONTROL_LOADED__ = true;

  console.log("[RemoteControl] YouTube RemoteControl initializing...");

  const WS_URLS = ["ws://127.0.0.1:8000/ws", "ws://localhost:8000/ws"];
  let wsUrlIndex = 0;
  let socket = null;
  let reconnectTimer = null;
  let isConnected = false;

  // Drag state
  let isDragging = false;
  let dragStartVideoTime = 0;
  let dragVideoDuration = 1;
  let lastTargetTime = 0;

  // DOM Elements accessors
  function getPlayer() {
    return document.getElementById("movie_player") || (window && window.movie_player);
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
  // On-Screen Floating HUD & Notifications (Zero innerHTML for strict CSP compliance)
  // -------------------------------------------------------------------------
  const overlayContainer = document.createElement("div");
  overlayContainer.id = "remotecontrol-yt-hud";
  overlayContainer.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999999;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:10px;user-select:none;";

  // Status Pill
  const statusPill = document.createElement("div");
  statusPill.id = "remotecontrol-status-pill";
  statusPill.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:9999px;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.12);color:rgb(148,163,184);font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;box-shadow:0 4px 20px rgba(0,0,0,0.5);transition:all 0.3s ease;opacity:0.9;";

  const statusDot = document.createElement("span");
  statusDot.id = "remotecontrol-dot";
  statusDot.style.cssText = "width:8px;height:8px;border-radius:50%;background:rgb(239,68,68);box-shadow:0 0 8px rgb(239,68,68);transition:all 0.3s ease;";

  const statusLabel = document.createElement("span");
  statusLabel.id = "remotecontrol-label";
  statusLabel.textContent = "RemoteControl Connecting...";

  statusPill.appendChild(statusDot);
  statusPill.appendChild(statusLabel);

  // Action Notification Banner (Volume / Next / Prev / Scrub)
  const actionBanner = document.createElement("div");
  actionBanner.id = "remotecontrol-action-banner";
  actionBanner.style.cssText = "display:none;align-items:center;gap:10px;padding:10px 18px;border-radius:14px;background:rgba(10,15,30,0.95);backdrop-filter:blur(12px);border:1px solid rgba(6,182,212,0.4);color:rgb(248,250,252);font-size:14px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,0.6),0 0 20px rgba(6,182,212,0.25);transition:transform 0.2s cubic-bezier(0.16,1,0.3,1),opacity 0.2s ease;transform:translateY(10px) scale(0.96);opacity:0;";

  overlayContainer.appendChild(actionBanner);
  overlayContainer.appendChild(statusPill);

  function attachOverlay() {
    if (!document.getElementById("remotecontrol-yt-hud") && document.body) {
      document.body.appendChild(overlayContainer);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachOverlay);
  } else {
    attachOverlay();
  }

  let bannerTimer = null;
  function showBanner(iconText, titleText, detailText, durationMs = 1500) {
    attachOverlay();
    while (actionBanner.firstChild) {
      actionBanner.removeChild(actionBanner.firstChild);
    }

    const iconSpan = document.createElement("span");
    iconSpan.style.cssText = "font-size:18px;";
    iconSpan.textContent = iconText;
    actionBanner.appendChild(iconSpan);

    const textCol = document.createElement("div");
    textCol.style.cssText = "display:flex;flex-direction:column;gap:2px;";

    const titleSpan = document.createElement("span");
    titleSpan.style.cssText = "font-size:14px;font-weight:800;color:rgb(255,255,255);";
    titleSpan.textContent = titleText;
    textCol.appendChild(titleSpan);

    if (detailText) {
      const detailSpan = document.createElement("span");
      detailSpan.style.cssText = "font-size:11px;font-weight:600;color:rgb(6,182,212);";
      detailSpan.textContent = detailText;
      textCol.appendChild(detailSpan);
    }

    actionBanner.appendChild(textCol);
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

  function showVolumeBanner(vol) {
    attachOverlay();
    while (actionBanner.firstChild) {
      actionBanner.removeChild(actionBanner.firstChild);
    }

    const icon = vol === 0 ? "🔇" : vol < 50 ? "🔉" : "🔊";
    const iconSpan = document.createElement("span");
    iconSpan.style.cssText = "font-size:18px;";
    iconSpan.textContent = icon;
    actionBanner.appendChild(iconSpan);

    const col = document.createElement("div");
    col.style.cssText = "display:flex;flex-direction:column;gap:4px;";

    const label = document.createElement("span");
    label.style.cssText = "font-size:11px;font-weight:700;color:rgb(148,163,184);text-transform:uppercase;";
    label.textContent = "Site Volume";
    col.appendChild(label);

    const barRow = document.createElement("div");
    barRow.style.cssText = "display:flex;align-items:center;gap:8px;";

    const barOuter = document.createElement("div");
    barOuter.style.cssText = "width:100px;height:6px;background:rgba(255,255,255,0.15);border-radius:999px;overflow:hidden;";

    const barFill = document.createElement("div");
    barFill.style.cssText = "width:" + vol + "%;height:100%;background:linear-gradient(90deg,rgb(6,182,212),rgb(59,130,246));border-radius:999px;";
    barOuter.appendChild(barFill);

    const pctSpan = document.createElement("span");
    pctSpan.style.cssText = "color:rgb(6,182,212);font-size:13px;font-weight:800;min-width:32px;";
    pctSpan.textContent = vol + "%";

    barRow.appendChild(barOuter);
    barRow.appendChild(pctSpan);
    col.appendChild(barRow);
    actionBanner.appendChild(col);

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
    }, 1200);
  }

  function updateStatus(connected) {
    isConnected = connected;
    if (connected) {
      statusDot.style.background = "rgb(16,185,129)";
      statusDot.style.boxShadow = "0 0 10px rgb(16,185,129)";
      statusLabel.textContent = "RemoteControl Ready";
      statusPill.style.borderColor = "rgba(16, 185, 129, 0.4)";
      statusPill.style.color = "rgb(167,243,208)";
      showBanner("⚡", "RemoteControl Connected", "Site Volume & Visual Scrubber Active", 2000);
      setTimeout(() => {
        if (isConnected) statusPill.style.opacity = "0.35";
      }, 3500);
    } else {
      statusDot.style.background = "rgb(239,68,68)";
      statusDot.style.boxShadow = "0 0 8px rgb(239,68,68)";
      statusLabel.textContent = "RemoteControl Reconnecting...";
      statusPill.style.borderColor = "rgba(239, 68, 68, 0.4)";
      statusPill.style.color = "rgb(252,165,165)";
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
      return h + ":" + (remM < 10 ? "0" : "") + remM + ":" + (rem < 10 ? "0" : "") + rem;
    }
    return m + ":" + (rem < 10 ? "0" : "") + rem;
  }

  // -------------------------------------------------------------------------
  // Media Control Actions (Site-Only Volume, Next, Prev, Play/Pause)
  // -------------------------------------------------------------------------

  function handleVolume(deltaPercent) {
    const player = getPlayer();
    const video = getVideo();

    let newVol = 100;
    let found = false;

    if (player && typeof player.setVolume === "function" && typeof player.getVolume === "function") {
      try {
        const cur = player.getVolume();
        newVol = Math.max(0, Math.min(100, Math.round(cur + deltaPercent)));
        player.setVolume(newVol);
        if (player.isMuted() && deltaPercent > 0) {
          player.unMute();
        }
        found = true;
      } catch (e) {}
    }

    if (video) {
      try {
        const curNorm = video.volume;
        const targetNorm = Math.max(0, Math.min(1.0, curNorm + deltaPercent / 100));
        video.volume = targetNorm;
        if (video.muted && deltaPercent > 0) {
          video.muted = false;
        }
        if (!found) {
          newVol = Math.round(targetNorm * 100);
        }
      } catch (e) {}
    }

    showVolumeBanner(newVol);
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
      showBanner("⏭", "Next Video", "Advancing playback", 1500);
      return;
    }

    // 3. For standalone videos without playlist/autoplay, navigate to top recommendation
    const recCandidates = [
      "ytd-compact-video-renderer a[id='thumbnail']",
      "ytd-rich-item-renderer a[id='thumbnail']",
      "[id='related'] ytd-compact-video-renderer a[id='thumbnail']",
      "ytd-watch-next-secondary-results-renderer a[id='thumbnail']",
      "[id='items'] ytd-compact-video-renderer a.yt-simple-endpoint",
    ];

    for (let i = 0; i < recCandidates.length; i++) {
      const link = document.querySelector(recCandidates[i]);
      if (link && link.href && link.href.includes("watch?v=")) {
        const titleElem = link.closest("ytd-compact-video-renderer, ytd-rich-item-renderer")?.querySelector("[id='video-title']");
        const nextTitle = titleElem ? titleElem.textContent.trim() : "Recommended Video";
        showBanner("⏭", "Next Video", nextTitle.slice(0, 35) + "...", 2000);
        link.click();
        return;
      }
    }

    showBanner("⏭", "Next Video", "Triggered", 1500);
  }

  function handlePrevious() {
    const player = getPlayer();
    const video = getVideo();
    const currTime = video ? video.currentTime : 0;

    // Standard media player behavior:
    // If playing for > 3 seconds, restart current track from 0:00!
    if (currTime > 3.0) {
      if (player && typeof player.seekTo === "function") {
        try { player.seekTo(0, true); } catch (e) {}
      }
      if (video) {
        try { video.currentTime = 0; } catch (e) {}
      }
      showBanner("⏮", "Restarted from 0:00", "Beginning of video", 1500);
      return;
    }

    // If already at beginning (<= 3s), navigate to previous track or back in history
    if (player && typeof player.previousVideo === "function") {
      try {
        player.previousVideo();
        showBanner("⏮", "Previous Video", "Navigating backward", 1500);
        return;
      } catch (e) {}
    }

    const prevBtn = document.querySelector(".ytp-prev-button");
    if (prevBtn && !prevBtn.hasAttribute("aria-disabled") && prevBtn.offsetParent !== null) {
      prevBtn.click();
      showBanner("⏮", "Previous Video", "Navigating backward", 1500);
      return;
    }

    // History back
    if (window.history.length > 1) {
      showBanner("⏮", "Going Back", "Browser history", 1500);
      window.history.back();
    } else {
      if (video) video.currentTime = 0;
      showBanner("⏮", "Beginning of Video", "At start", 1500);
    }
  }

  function handlePlayPause() {
    const player = getPlayer();
    const video = getVideo();

    if (player && typeof player.getPlayerState === "function") {
      try {
        const state = player.getPlayerState();
        if (state === 1) {
          player.pauseVideo();
          showBanner("⏸", "Paused", "", 1200);
        } else {
          player.playVideo();
          showBanner("▶", "Playing", "", 1200);
        }
        return;
      } catch (e) {}
    }

    if (video) {
      if (video.paused) {
        video.play();
        showBanner("▶", "Playing", "", 1200);
      } else {
        video.pause();
        showBanner("⏸", "Paused", "", 1200);
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
      bar.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: clientX, clientY: clientY, buttons: 1 }));
    } catch (e) {}

    // Add dragging classes to show player controls & scrubber handle
    const player = getPlayer();
    if (player && player.classList) {
      player.classList.add("ytp-dragging");
      player.classList.remove("ytp-autohide");
    }

    statusPill.style.opacity = "1";
    statusPill.style.borderColor = "rgba(6, 182, 212, 0.7)";
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
      bar.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: clientX, clientY: clientY, buttons: 1 }));
    } catch (e) {}

    // 2. Direct DOM Styling: physically slide the red scrubber knob and progress fill
    const progressWidthPx = targetRatio * rect.width;
    if (scrubber) {
      scrubber.style.transform = "translateX(" + progressWidthPx + "px)";
    }
    if (playProgress) {
      playProgress.style.transform = "scaleX(" + targetRatio + ")";
    }

    // 3. Update preview tooltip position and time text
    if (tooltip) {
      tooltip.style.display = "block";
      tooltip.style.left = clientX + "px";
      tooltip.classList.remove("ytp-tooltip-hidden");
    }
    if (tooltipText) {
      const sign = deltaSeconds >= 0 ? "+" : "";
      tooltipText.textContent = formatSeconds(targetTime) + " (" + sign + Math.round(deltaSeconds) + "s)";
    }

    // 4. Seek video preview frame in real-time (allowSeekAhead = false keeps it smooth without buffering hang)
    if (player && typeof player.seekTo === "function") {
      try {
        player.seekTo(targetTime, false);
      } catch (e) {}
    }

    // 5. On-Screen HUD feedback
    const sign = deltaSeconds >= 0 ? "+" : "";
    showBanner(
      "⟷",
      formatSeconds(targetTime) + " / " + formatSeconds(dragVideoDuration),
      "Scrubbing " + sign + Math.round(deltaSeconds) + "s",
      1200
    );
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
        bar.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: clientX, clientY: clientY, buttons: 0 }));
      } catch (e) {}
    }

    // Commit seek with allowSeekAhead = true
    if (player && typeof player.seekTo === "function") {
      try { player.seekTo(lastTargetTime, true); } catch (e) {}
    }
    if (video) {
      try { video.currentTime = lastTargetTime; } catch (e) {}
    }

    // Clean up dragging classes and tooltip
    if (player && player.classList) {
      player.classList.remove("ytp-dragging");
    }
    if (tooltip) {
      setTimeout(() => {
        tooltip.style.display = "";
      }, 300);
    }

    showBanner("✓", "Seek Committed", formatSeconds(lastTargetTime), 1500);

    setTimeout(() => {
      if (isConnected) statusPill.style.opacity = "0.35";
      statusPill.style.borderColor = "rgba(16, 185, 129, 0.4)";
    }, 1500);
  }

  // -------------------------------------------------------------------------
  // WebSocket Communication with GestureDeck Core
  // -------------------------------------------------------------------------

  function connect() {
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
      return;
    }

    const currentUrl = WS_URLS[wsUrlIndex % WS_URLS.length];
    try {
      socket = new WebSocket(currentUrl);
    } catch (err) {
      console.warn("[RemoteControl] WebSocket connection error to " + currentUrl + ":", err);
      wsUrlIndex++;
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      console.log("%c[RemoteControl] Connected to backend on " + currentUrl + "!", "color: rgb(16,185,129); font-weight: bold;");
      updateStatus(true);

      // Register this client as the YouTube RemoteControl
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
                showBanner("⟷", "Seek " + sign + Math.round(delta) + "s", formatSeconds(target), 1200);
              }
            }
          }
        }
      } catch (err) {
        console.error("[RemoteControl] Error parsing message:", err);
      }
    };

    socket.onclose = () => {
      updateStatus(false);
      if (isDragging) {
        commitScrub();
      }
      wsUrlIndex++;
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

  function ping() {
    attachOverlay();
    if (socket && socket.readyState === WebSocket.OPEN) {
      showBanner("⚡", "RemoteControl Active", "Connected to GestureDeck", 1500);
      updateStatus(true);
    } else {
      showBanner("⚡", "RemoteControl Connecting...", "Establishing link...", 1500);
      connect();
    }
  }

  window.__REMOTECONTROL_BRIDGE__ = {
    ping: ping,
    connect: connect,
    getSocket: function () { return socket; },
    isConnected: function () { return isConnected; },
  };

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
