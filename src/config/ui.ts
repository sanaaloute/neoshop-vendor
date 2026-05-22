/** UI timing and layout constants to avoid magic numbers scattered through components. */

export const UI_DELAYS = {
  /** Default debounce for form autosave (ms). */
  AUTOSAVE_DEBOUNCE: 700,
  /** Product form autosave debounce (ms). */
  PRODUCT_AUTOSAVE_DEBOUNCE: 850,
  /** How long toast / hint messages remain visible (ms). */
  HINT_DISMISS: 5000,
  /** Typing indicator timeout for chat (ms). */
  TYPING_IDLE: 1200,
  /** Peer typing clear timeout for chat (ms). */
  PEER_TYPING_CLEAR: 4500,
} as const;

export const UI_LIMITS = {
  /** Max file size for onboarding uploads (bytes). */
  ONBOARDING_FILE_MAX_BYTES: 12 * 1024 * 1024,
  /** Max notes / description length (characters). */
  MAX_NOTES_LENGTH: 500,
  /** Max product slug length (characters). */
  MAX_SLUG_LENGTH: 120,
  /** Default pagination page size. */
  DEFAULT_PAGE_SIZE: 100,
  /** Max inventory movements kept in local store. */
  MAX_INVENTORY_MOVEMENTS: 300,
} as const;

export const UI_BREAKPOINTS = {
  DESKTOP: 1024,
} as const;

export const UI_RETRY = {
  /** Axios timeout (ms). */
  AXIOS_TIMEOUT: 30_000,
  /** Max WebSocket reconnect delay cap (ms). */
  WS_RECONNECT_CAP: 30_000,
  /** Axios retry count. */
  AXIOS_RETRIES: 3,
} as const;
