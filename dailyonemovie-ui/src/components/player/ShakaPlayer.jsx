import React, { useEffect, useRef, useState } from "react";
import shaka from "shaka-player/dist/shaka-player.ui";
import "shaka-player/dist/controls.css";

const playerConfig = {
  abr: {
    enabled: true,
    defaultBandwidthEstimate: 5000000,
    switchInterval: 4,
    bandwidthUpgradeTarget: 0.75,
    bandwidthDowngradeTarget: 0.85,
    droppedFrames: true,
    clearBufferSwitch: false,
    cacheLoadThreshold: 20,
    minTimeToSwitch: 2,
    useNetworkInformation: true,
  },
  streaming: {
    lowLatencyMode: false,
    bufferingGoal: 30,
    rebufferingGoal: 3.5,
    bufferBehind: 15,
    segmentPrefetchLimit: 3,
    stallEnabled: true,
    stallThreshold: 0.8,
    stallSkip: 0.05,
    loadTimeout: 30,
    retryParameters: {
      maxAttempts: 4,
      baseDelay: 1000,
      backoffFactor: 2,
      fuzzFactor: 0.1,
      timeout: 30000,
    },
    allowMediaSourceRecoveries: true,
    evictionGoal: 15,
    stopFetchingOnPause: true,
    safeSeekOffset: 3,
    updateIntervalSeconds: 0.25,
    observeQualityChanges: true,
    preferNativeHls: false,
    preferNativeDash: false,
  },
  manifest: {
    continueLoadingWhenPaused: false,
    retryParameters: {
      maxAttempts: 4,
      baseDelay: 1000,
      backoffFactor: 2,
      fuzzFactor: 0.1,
      timeout: 30000,
    },
  },
  mediaSource: {
    codecSwitchingStrategy: "smooth",
    forceTransmux: false,
  },
  cmcd: { enabled: false },
  cmsd: { enabled: false },
};

const uiConfig = {
  bigButtons: ["play_pause"],
  controlPanelElements: [
    "rewind",
    "play_pause",
    "fast_forward",
    "time_and_duration",
    "spacer",
    "mute",
    "volume",
    "fullscreen",
    "overflow_menu",
  ],
  overflowMenuButtons: [
    "playback_rate",
    "picture_in_picture",
    "quality",
    "language",
    "captions",
    "statistics",
  ],
  seekBarColors: {
    base: "rgba(255,255,255,0.15)",
    buffered: "rgba(255,255,255,0.35)",
    played: "#ffffff",
    adBreaks: "#facc15",
    chapters: "#22c55e",
  },
  playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  addSeekBar: true,
  seekOnTaps: true,
  tapSeekDistance: 10,
  keyboardSeekDistance: 5,
  keyboardLargeSeekDistance: 10,
  fadeDelay: 1500,
  closeMenusDelay: 2000,
  doubleClickForFullscreen: true,
  singleClickForPlayAndPause: true,
  enableKeyboardPlaybackControls: true,
  enableKeyboardPlaybackControlsInWindow: true,
  enableTooltips: true,
  captionsStyles: true,
  captionsFontScaleFactors: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  documentPictureInPicture: {
    enabled: true,
    preferInitialWindowPlacement: true,
    disallowReturnToOpener: true,
  },
  qualityMarks: {
    720: "HD",
    1080: "FHD",
    1440: "2K",
    2160: "4K UHD",
    4320: "8K UHD",
  },
  mediaSession: {
    enabled: true,
    handleMetadata: true,
    handleActions: true,
    handlePosition: true,
    supportedActions: ["play", "pause", "seekbackward", "seekforward", "previoustrack", "nexttrack"],
    allowAutoPiP: true,
  },
  alwaysShowVolumeBar: false,
  volumeBarColors: {
    base: "rgba(255,255,255,0.2)",
    level: "#ffffff",
  },
  showUnbufferedStart: true,
  allowTogglePresentationTime: true,
  showRemainingTimeInPresentationTime: true,
  clearBufferOnQualityChange: false,
  showMenusOnTheRight: true,
  showUIOnPaused: true,
  showUIAlways: false,
  enableFullscreenOnRotation: true,
  forceLandscapeOnFullscreen: false,
  showAudioCodec: false,
  showVideoCodec: false,
  preferIntlDisplayNames: true,
};

const ShakaPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // Custom tracking state to manage user hover interactions explicitly
  const [isUserActive, setIsUserActive] = useState(true);
  const timeoutRef = useRef(null);

  // Helper function to reset the visual decay timer
  const resetIdleTimer = () => {
    setIsUserActive(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only drop visibility if the media asset is actively tracking forward
    if (videoRef.current && !videoRef.current.paused) {
      timeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 1500); // Matches your preferred 1.5s delay perfectly
    }
  };

  useEffect(() => {
    let player;
    let ui;

    const initPlayer = async () => {
      try {
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          console.error("Browser not supported!");
          return;
        }

        const video = videoRef.current;
        const container = containerRef.current;

        player = new shaka.Player();
        await player.attach(video);
        player.configure(playerConfig);

        ui = new shaka.ui.Overlay(player, container, video);
        ui.configure(uiConfig);

        window.player = player;
        window.ui = ui;

        player.addEventListener("error", (event) => console.error("Shaka Error", event.detail));

        // Listen for internal state transitions to keep UI visible during pauses or stalls
        video.addEventListener("play", resetIdleTimer);
        video.addEventListener("pause", () => {
          setIsUserActive(true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        });
        video.addEventListener("waiting", () => {
          setIsUserActive(true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        });

        await player.load(src);
        console.log("Video loaded successfully");
      } catch (error) {
        console.error("Shaka Initialization Error", error);
      }
    };

    initPlayer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (player) player.destroy();
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
      className={`w-full bg-black relative overflow-hidden rounded-xl group transition-all duration-300
        ${!isUserActive ? "cursor-none [&_.shaka-controls-container]:!opacity-0 [&_.shaka-controls-container]:!pointer-events-none" : "cursor-default [&_.shaka-controls-container]:!opacity-100"}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-auto"
      />
    </div>
  );
};

export default ShakaPlayer;   