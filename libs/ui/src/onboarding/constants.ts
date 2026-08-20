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
