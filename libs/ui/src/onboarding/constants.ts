/* ==========================================================================
   Onboarding engine constants.

   The single source of truth for tour z-index values. The runtime enforcement
   lives in the theme zLadder (theme.other.zLadder.tour = 9000), added by
   Phase 1 step 6. These constants are the engine's own copy for the barrel
   export and for self-documenting the budget (D7).
   ========================================================================== */

/** Above the tooltip rung (8000) in the ADS zLadder. */
export const OVERLAY_Z = 9000;

/** Above the overlay, so the card clears the dim layer. */
export const POPOVER_Z = 9100;

/**
 * Minimum measured width and height, in CSS px, for a target rect to count as
 * live (improvement 02). A rect below this is "mounted but empty" (a revealed
 * panel with no content, like the Print panel with no layouts), so the auto-
 * skip treats it like a missing target. measureTarget already nulls a 0×0 rect;
 * this catches the near-empty case above zero.
 */
export const LIVE_RECT_MIN_SIZE = 4;
