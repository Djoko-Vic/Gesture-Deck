// ==UserScript==
// @name         GestureDeck YouTube Bridge
// @namespace    http://localhost:8000/
// @version      1.0.0
// @description  Direct visual scrubber drag, site-only volume, and gesture navigation for GestureDeck on YouTube
// @author       GestureDeck
// @match        *://*.youtube.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

// Inject content.js code
(function () {
  const script = document.createElement("script");
  script.src = "http://localhost:8000/static/extension/content.js";
  // Fallback to inline if static not mounted
  script.onerror = () => {
    console.log("[GestureDeck UserScript] Loading inline fallback...");
  };
  document.head.appendChild(script);
})();
