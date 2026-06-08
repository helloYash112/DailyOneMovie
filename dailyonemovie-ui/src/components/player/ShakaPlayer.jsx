import React, { useEffect, useRef } from "react";

import shaka from "shaka-player/dist/shaka-player.ui";

import "shaka-player/dist/controls.css";

const playerConfig = {
  abr: {
    enabled: true,
    defaultBandwidthEstimate: 5000000,
    switchInterval: 6,
    bandwidthUpgradeTarget: 0.85,
    bandwidthDowngradeTarget: 0.98,
    droppedFrames: true,
    clearBufferSwitch: false,
    cacheLoadThreshold: 20,
    minTimeToSwitch: 2,
    useNetworkInformation: false,
  },

  streaming: {
    lowLatencyMode: false,

    bufferingGoal: 30,
    rebufferingGoal: 8,
    bufferBehind: 15,

    segmentPrefetchLimit: 4,

    stallEnabled: true,
    stallThreshold: 0.8,
    stallSkip: 0.05,

    loadTimeout: 60,

    retryParameters: {
      maxAttempts: 5,
      baseDelay: 1500,
      backoffFactor: 2,
      fuzzFactor: 0.5,
      timeout: 90000,
    },

    allowMediaSourceRecoveries: true,

    evictionGoal: 5,

    stopFetchingOnPause: true,

    safeSeekOffset: 3,

    updateIntervalSeconds: 0.5,

    observeQualityChanges: true,

    preferNativeHls: false,
    preferNativeDash: false,
  },

  manifest: {
    continueLoadingWhenPaused: false,

    retryParameters: {
      maxAttempts: 5,
      baseDelay: 1500,
      backoffFactor: 2,
      fuzzFactor: 0.5,
      timeout: 90000,
    },
  },

  mediaSource: {
    codecSwitchingStrategy: "smooth",
    forceTransmux: false,
  },

  cmcd: {
    enabled: false,
  },

  cmsd: {
    enabled: false,
  },
};

const uiConfig = {
  // BIG CENTER BUTTONS
  bigButtons: ["play_pause"],

  // MAIN CONTROL BAR
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

  // OVERFLOW MENU
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
/*
customTrackLabel: (label, track, type) => {
  const lang = label || track.language;

  if (type === "audio") {
    if (track.channelsCount === 6) {
      return `🎵 ${lang} 5.1`;
    }

    return `🎵 ${lang} Stereo`;
  }

  if (type === "text") {
    return `💬 ${lang} Subtitles`;
  }

  return lang;
},*/

  // PLAYBACK SPEEDS
  playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],

  // SEEK SETTINGS
  addSeekBar: true,
  seekOnTaps: true,
  tapSeekDistance: 10,

  keyboardSeekDistance: 5,
  keyboardLargeSeekDistance: 10,

  // UI EXPERIENCE
  fadeDelay: 3000,
  closeMenusDelay: 3000,

  // INTERACTIONS
  doubleClickForFullscreen: true,
  singleClickForPlayAndPause: true,

  // KEYBOARD CONTROLS
  enableKeyboardPlaybackControls: true,
  enableKeyboardPlaybackControlsInWindow: true,

  // TOOLTIPS
  enableTooltips: true,
  captionsStyles:true,
  captionsFontScaleFactors:[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
documentPictureInPicture: {
  enabled: true,

  // Opens PiP window in same place every time
  preferInitialWindowPlacement: true,

  // Keep return-to-tab button visible
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

  // Automatically update media metadata
  handleMetadata: true,

  // Handle play/pause/seek actions
  handleActions: true,

  // Sync playback position
  handlePosition: true,

  // Supported controls
  supportedActions: [
    "play",
    "pause",
    "seekbackward",
    "seekforward",
    "previoustrack",
    "nexttrack",
  ],

  // Allow browser automatic PiP behavior
  allowAutoPiP: true,
},

  // VOLUME
  alwaysShowVolumeBar: false,
   volumeBarColors: {
    base: "rgba(255,255,255,0.2)",
    level: "#ffffff",
  },
 

  // BUFFER VISUALIZATION
  showUnbufferedStart: true,

  // TIME DISPLAY
  allowTogglePresentationTime: true,
  showRemainingTimeInPresentationTime: true,

  // QUALITY SWITCHING
  clearBufferOnQualityChange: false,

  // MENU POSITION
  showMenusOnTheRight: true,

  // UI VISIBILITY
  showUIOnPaused: true,
  showUIAlways: false,

  // MOBILE EXPERIENCE
  enableFullscreenOnRotation: true,
  forceLandscapeOnFullscreen: false,

  

  // BETTER TRACK LABELS
  showAudioCodec: false,
  showVideoCodec: false,

  // ACCESSIBILITY
  preferIntlDisplayNames: true,
};


const ShakaPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let player;
    let ui;

    const initPlayer = async () => {
      try {
        // Install polyfills
        shaka.polyfill.installAll();

        // Browser support check
        if (!shaka.Player.isBrowserSupported()) {
          console.error("Browser not supported!");
          return;
        }

        const video = videoRef.current;
        const container = containerRef.current;

        // Create player
        player = new shaka.Player();

        // IMPORTANT
        await player.attach(video);

        // Configure player
        player.configure(playerConfig);

        // Create UI overlay
        ui = new shaka.ui.Overlay(player, container, video);

        // Configure UI
        ui.configure(uiConfig);

        // Debug
        window.player = player;
        window.ui = ui;

        // Error handling
        player.addEventListener("error", onErrorEvent);

        // Load video
        await player.load(src);

        console.log("Video loaded successfully");
      } catch (error) {
        onError(error);
      }
    };

    const onErrorEvent = (event) => {
      onError(event.detail);
    };

    const onError = (error) => {
      console.error("Shaka Error", error);
    };

    initPlayer();

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-black relative overflow-hidden rounded-xl"
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
