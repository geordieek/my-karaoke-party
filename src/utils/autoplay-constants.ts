/**
 * Constants for autoplay functionality
 */
export const AUTOPLAY_CONSTANTS = {
  // Delay before fallback autoplay when immediate autoplay fails (in milliseconds)
  FALLBACK_DELAY_MS: 5000,

  // Delay before auto-redirecting to YouTube when embed fails (in milliseconds)
  AUTO_REDIRECT_DELAY_MS: 5000,

  // Shorter delay when returning to app from being blurred (in milliseconds)
  RETURN_TO_APP_DELAY_MS: 1000,

  // Throttle delay for horn sounds (in milliseconds)
  HORN_THROTTLE_MS: 5000,
} as const;

/**
 * User-facing messages for autoplay states
 */
export const AUTOPLAY_MESSAGES = {
  AUTO_REDIRECTING: `Auto-redirecting in ${AUTOPLAY_CONSTANTS.AUTO_REDIRECT_DELAY_MS / 1000} seconds...`,
  AUTO_REDIRECT_PAUSED: "Auto-redirect paused - return to app to continue",
  AUTOPLAY_BLOCKED: "Autoplay blocked by browser",
  AUTOPLAY_DELAYED: `Autoplaying in ${AUTOPLAY_CONSTANTS.FALLBACK_DELAY_MS / 1000} seconds...`,
} as const;
