// src/components/ShakaPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import shaka from "shaka-player/dist/shaka-player.ui";
import "shaka-player/dist/controls.css";

/**
 * =========================
 * PLAYER CONFIG (Netflix-style)
 * =========================
 */
const playerConfig = {
  abr: {
    enabled: true,
    defaultBandwidthEstimate: 6000000,
    switchInterval: 4,
    bandwidthUpgradeTarget: 0.85,
    bandwidthDowngradeTarget: 0.95,
  },
  streaming: {
    bufferingGoal: 30,
    rebufferingGoal: 3,
    lowLatencyMode: false,
    retryParameters: {
      maxAttempts: 5,
      baseDelay: 1000,
      backoffFactor: 2,
    },
  },
  manifest: {
    retryParameters: { maxAttempts: 5 },
  },
  mediaSource: {
    codecSwitchingStrategy: "smooth",
  },
};

/**
 * =========================
 * UI CONFIG (Netflix-style)
 * =========================
 */
const uiConfig = {
  controlPanelElements: [
    "play_pause",
    "time_and_duration",
    "spacer",
    "mute",
    "volume",
    "quality",
    "playback_rate",
    "fullscreen",
  ],
  overflowMenuButtons: [
    "quality",
    "playback_rate",
    "audio",
    "captions",
    "picture_in_picture",
    "statistics",
  ],
  seekBarColors: {
    base: "rgba(255,255,255,0.2)",
    buffered: "rgba(255,255,255,0.4)",
    played: "#ffffff",
  },
  doubleClickForFullscreen: true,
  singleClickForPlayAndPause: true,
  enableTooltips: true,
};

const ShakaPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const uiRef = useRef(null);
  const hideTimer = useRef(null);

  const [uiVisible, setUiVisible] = useState(true);

  /**
   * Auto-hide UI (Netflix-style)
   */
  const showUI = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended) {
        setUiVisible(false);
      }
    }, 1800);
  }, []);

  /**
   * Init Shaka Player
   */
  useEffect(() => {
    let player;
    let ui;

    const init = async () => {
      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        console.error("Shaka not supported");
        return;
      }

      const video = videoRef.current;
      const container = containerRef.current;

      player = new shaka.Player(video);
      player.configure(playerConfig);

      ui = new shaka.ui.Overlay(player, container, video);
      ui.configure(uiConfig);

      playerRef.current = player;
      uiRef.current = ui;

      // Send cookies for private bucket playback
      player.getNetworkingEngine().registerRequestFilter((type, request) => {
        request.allowCrossSiteCredentials = true;
      });

      // Error handling
      player.addEventListener("error", (e) => {
        console.error("Shaka error:", e.detail);
      });

      // Load stream
      await player.load(src);
    };

    init();

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (playerRef.current) playerRef.current.destroy();
      if (uiRef.current) uiRef.current.destroy();
    };
  }, [src]);

  /**
   * Video event handlers
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => showUI();
    const onPause = () => setUiVisible(true);
    const onWaiting = () => setUiVisible(true);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
    };
  }, [showUI]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleKey = (e) => {
      switch (e.code) {
        case "Space":
          video.paused ? video.play() : video.pause();
          break;
        case "ArrowRight":
          video.currentTime += 10;
          break;
        case "ArrowLeft":
          video.currentTime -= 10;
          break;
        case "KeyM":
          video.muted = !video.muted;
          break;
        case "KeyF":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen();
          }
          break;
        case "KeyP":
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
          } else {
            video.requestPictureInPicture();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        autoPlay
        style={{ backgroundColor: "black" }}
      />

      {/* Overlay fade */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          uiVisible
            ? "opacity-100"
            : "opacity-0 transition-opacity duration-500"
        }`}
      >
        {/* Shaka UI attaches here */}
      </div>
    </div>
  );
};

export default ShakaPlayer;
