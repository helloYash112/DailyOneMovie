import { useEffect, useRef, useState } from "react";
import shaka from "shaka-player/dist/shaka-player.ui.js";
import "shaka-player/dist/controls.css";
// Remove HEVC plugin unless you specifically need it
// import "@hevcjs/shaka-plugin";

if (typeof window !== "undefined" && !window.shaka) {
  window.shaka = shaka;
}

export default function ShakaPlayer({
  src,
  playRangeStart = 0,
  bufferingGoal = 60,   // safer default
  rebufferingGoal = 30, // smoother recovery
  autoPlay = true,
  muted = false,
  uiLocale = "en",
  preferredAudioLanguage = "",
  preferredTextLanguage = "",
  showSubtitles = false,
  onStatsUpdate,
  onTracksUpdate,
  onActiveTrackChange,
  onError,
  onLog,
  onStateChange,
  onPlayerReady,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [playerInstance, setPlayerInstance] = useState(null);
  const [uiInstance, setUiInstance] = useState(null);
  const [internalError, setInternalError] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const logMessage = (type, text) => {
    if (onLog) {
      onLog({ type, text, time: new Date().toLocaleTimeString() });
    }
  };

  useEffect(() => {
    let player = null;
    let ui = null;
    let statsInterval = null;

    async function initPlayer() {
      try {
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          const errMsg = "Browser not supported by Shaka Player";
          setInternalError(errMsg);
          if (onError) onError(new Error(errMsg));
          return;
        }

        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        player = new shaka.Player(video);

        ui = new shaka.ui.Overlay(player, container, video);
        ui.configure({
          enableTooltips: true,
          addSeekBar: true,
          controlPanelElements: [
            "play_pause",
            "time_and_duration",
            "spacer",
            "mute",
            "volume",
            "fullscreen",
            "overflow_menu",
          ],
          overflowMenuButtons: [
            "quality",
            "language",
            "captions",
            "picture_in_picture",
            "playback_rate",
          ],
        });

        player.configure({
          playRangeStart,
          streaming: {
            bufferingGoal,
            rebufferingGoal,
            lowLatencyMode: false, // disable unless live low-latency CMAF
            jumpLargeGaps: true,
            smallGapLimit: 0.5,
          },
        });

        setPlayerInstance(player);
        setUiInstance(ui);
        if (onPlayerReady) onPlayerReady(player);

        if (src) {
          await player.load(src);
          if (autoPlay) {
            video.muted = muted;
            video.play().catch(() => {});
          }
        }

        statsInterval = setInterval(() => {
          if (player && onStatsUpdate) {
            const stats = player.getStats();
            onStatsUpdate({
              width: stats.width,
              height: stats.height,
              streamBandwidth: Math.round(stats.streamBandwidth / 1000),
              decodedFrames: stats.decodedFrames,
              droppedFrames: stats.droppedFrames,
              playTime: stats.playTime,
              bufferingTime: stats.bufferingTime,
              loadTime: stats.loadTime,
              estimatedBandwidth: Math.round(stats.estimatedBandwidth / 1000) || 0,
            });
          }
          if (player && onTracksUpdate) {
            const tracks = player.getVariantTracks();
            onTracksUpdate(tracks);
            const active = tracks.find((t) => t.active);
            if (active && onActiveTrackChange) onActiveTrackChange(active);
          }
        }, 2000);

        // Listen for buffering events
        player.addEventListener("buffering", (event) => {
          setIsBuffering(event.buffering);
        });

        // Listen for errors
        player.addEventListener("error", (event) => {
          const err = event.detail;
          setInternalError(err.message || "Unknown error");
          if (onError) onError(err);
        });

      } catch (err) {
        setInternalError(`Init failed: ${err.message || err}`);
        if (onError) onError(err);
      }
    }

    initPlayer();

    return () => {
      if (statsInterval) clearInterval(statsInterval);
      if (ui) ui.destroy();
      if (player) player.destroy();
    };
  }, [src]);

  return (
    <div className="w-full relative bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
      <div id="shaka-video-container" ref={containerRef} className="w-full relative">
        <video
          id="shaka-video-element"
          ref={videoRef}
          className="w-full h-auto"
          crossOrigin="anonymous"
          playsInline
        />
        {isBuffering && (
          <span className="absolute top-4 left-4 bg-amber-500 text-black px-2 py-1 rounded">
            Buffering…
          </span>
        )}
        {internalError && (
          <span className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded">
            Error
          </span>
        )}
      </div>
      {internalError && (
        <div className="p-4 bg-red-900 text-red-300 text-xs">{internalError}</div>
      )}
    </div>
  );
}

