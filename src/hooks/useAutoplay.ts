import { useRef, useState, useEffect, useCallback } from "react";
import type { YouTubePlayer } from "react-youtube";
import { AUTOPLAY_CONSTANTS } from "~/utils/autoplay-constants";

interface UseAutoplayOptions {
  autoplay: boolean;
  onPlayerEnd: () => void;
  videoId: string;
}

interface UseAutoplayReturn {
  // State
  showManualPlayButton: boolean;
  showOpenInYouTubeButton: boolean;
  showDelayedAutoplayMessage: boolean;
  hasAutoRedirected: boolean;
  isWindowFocused: boolean;

  // Actions
  handlePlayerReady: (player: YouTubePlayer, isPlayerPlaying: boolean) => void;
  handlePlayerPlay: () => void;
  handlePlayerError: () => void;
  openYouTubeTab: (shouldMarkAsPlayed?: boolean) => void;
  resetManualPlayButton: () => void;
  clearAutoplayTimer: () => void;
}

/**
 * Custom hook to manage YouTube autoplay logic including:
 * - Browser autoplay restrictions handling
 * - Window focus/blur auto-play resumption
 * - Auto-redirect to YouTube for embed errors
 * - Timer management for delayed autoplay
 */
export function useAutoplay({
  autoplay,
  onPlayerEnd,
  videoId,
}: UseAutoplayOptions): UseAutoplayReturn {
  // Core autoplay state
  const [showManualPlayButton, setShowManualPlayButton] = useState(false);
  const [showOpenInYouTubeButton, setShowOpenInYouTubeButton] = useState(false);
  const [showDelayedAutoplayMessage, setShowDelayedAutoplayMessage] = useState(false);
  const [hasAutoRedirected, setHasAutoRedirected] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [autoplayTimer, setAutoplayTimer] = useState<NodeJS.Timeout | null>(null);

  // Refs for accessing current state in event handlers
  const autoplayRef = useRef(autoplay);
  const isWindowFocusedRef = useRef(true);
  const showOpenInYouTubeButtonRef = useRef(false);
  const shouldAutoplayOnReadyRef = useRef(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when state changes
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    isWindowFocusedRef.current = isWindowFocused;
  }, [isWindowFocused]);

  useEffect(() => {
    showOpenInYouTubeButtonRef.current = showOpenInYouTubeButton;
  }, [showOpenInYouTubeButton]);

  useEffect(() => {
    autoplayTimerRef.current = autoplayTimer;
  }, [autoplayTimer]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimer) {
        clearTimeout(autoplayTimer);
      }
    };
  }, [autoplayTimer]);

  const resetManualPlayButton = useCallback(() => {
    setShowManualPlayButton(false);
  }, []);

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      setAutoplayTimer(null);
      setShowDelayedAutoplayMessage(false);
    }
  }, []);

  const openYouTubeTab = useCallback(
    (shouldMarkAsPlayed = true) => {
      window.open(
        `https://www.youtube.com/watch?v=${videoId}#mykaraokeparty`,
        "_blank",
        "fullscreen=yes",
      );

      if (shouldMarkAsPlayed && onPlayerEnd) {
        onPlayerEnd();
      }
    },
    [videoId, onPlayerEnd],
  );

  const handlePlayerReady = useCallback(
    (player: YouTubePlayer, isPlayerPlaying: boolean) => {
      setHasAutoRedirected(false); // Reset for new video

      // Auto-play logic - runs when player is ready and not currently playing
      if (autoplay && !isPlayerPlaying && !autoplayTimer) {
        if (shouldAutoplayOnReadyRef.current) {
          // We returned from being blurred and player just became ready - auto-play immediately
          shouldAutoplayOnReadyRef.current = false; // Reset flag
          try {
            player.playVideo();
          } catch (error: unknown) {
            console.log("Immediate autoplay failed:", error);
          }
        } else {
          // Try immediate autoplay first (browsers are more lenient)
          try {
            const playPromise = player.playVideo();

            // If playVideo() returns a Promise, handle it
            if (playPromise && typeof playPromise.then === "function") {
              playPromise
                .then(() => {
                  // Autoplay succeeded
                })
                .catch((error: unknown) => {
                  console.log("Autoplay blocked by browser:", error);
                  // Fall back to manual play required
                  setShowManualPlayButton(true);
                });
            } else {
              // playVideo() doesn't return a promise, assume it worked
            }
          } catch (error) {
            console.log("Immediate autoplay failed, using timer:", error);
            // Fall back to delayed autoplay
            setShowDelayedAutoplayMessage(true);
            const timer = setTimeout(() => {
              setShowDelayedAutoplayMessage(false);
              if (player) {
                try {
                  player.playVideo();
                } catch (error: unknown) {
                  console.log("Autoplay blocked (fallback):", error);
                }
              }
            }, AUTOPLAY_CONSTANTS.FALLBACK_DELAY_MS);
            setAutoplayTimer(timer);
          }
        }
      }
    },
    [autoplay, autoplayTimer],
  );

  const handlePlayerPlay = useCallback(() => {
    // Clear autoplay timer when video starts playing
    clearAutoplayTimer();
  }, [clearAutoplayTimer]);

  const handlePlayerError = useCallback(() => {
    setShowOpenInYouTubeButton(true);

    // Auto-redirect logic for embed errors - only if window is focused
    if (autoplay && isWindowFocused && !hasAutoRedirected) {
      const timer = setTimeout(() => {
        // Double-check window is still focused before redirecting
        if (isWindowFocusedRef.current) {
          setHasAutoRedirected(true);
          openYouTubeTab(false); // Don't mark as played yet - wait until they return
        }
      }, AUTOPLAY_CONSTANTS.AUTO_REDIRECT_DELAY_MS);
      setAutoplayTimer(timer);
    }
  }, [autoplay, isWindowFocused, hasAutoRedirected, openYouTubeTab]);

  // Window focus/blur event listeners
  useEffect(() => {
    const handleFocus = () => {
      const wasBlurred = !isWindowFocusedRef.current;
      setIsWindowFocused(true);
      isWindowFocusedRef.current = true;

      // If returning from being blurred and we're in embed error state, mark video as played
      if (wasBlurred && showOpenInYouTubeButtonRef.current && onPlayerEnd) {
        onPlayerEnd();
      }

      // Auto-play when returning to the app from being blurred
      if (wasBlurred && autoplayRef.current) {
        // Clear any existing autoplay timer since we're returning from being blurred
        if (autoplayTimerRef.current) {
          clearTimeout(autoplayTimerRef.current);
          setAutoplayTimer(null);
        }

        // Set flag to auto-play when player becomes ready (if not ready yet)
        shouldAutoplayOnReadyRef.current = true;
      }
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
      isWindowFocusedRef.current = false;
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [onPlayerEnd]);

  return {
    showManualPlayButton,
    showOpenInYouTubeButton,
    showDelayedAutoplayMessage,
    hasAutoRedirected,
    isWindowFocused,
    handlePlayerReady,
    handlePlayerPlay,
    handlePlayerError,
    openYouTubeTab,
    resetManualPlayButton,
    clearAutoplayTimer,
  };
}
