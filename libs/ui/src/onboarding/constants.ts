/* ==========================================================================
   Onboarding engine constants.

   The runtime enforcement of the tour z-budget lives in the theme zLadder
   (theme.other.zLadder.tour = 9000, tourPopover = 9100), added by Phase 1
   step 6. These two constants are the engine's own copy for the barrel export
   and for self-documenting the budget (D7). The engine stays content-free and
   theme-free by design (D10), so it keeps its own literals instead of importing
   the theme. ads-mantine-theme.test.ts locks these against the ladder rungs, so
   a later edit to either rung fails against the mirror (F7).
   ========================================================================== */

/** The dim overlay. Mirrors theme.other.zLadder.tour (8000 = tooltip, below). */
export const OVERLAY_Z = 9000;

/** The card, above its own dim overlay. Mirrors theme.other.zLadder.tourPopover. */
export const POPOVER_Z = 9100;

/**
 * Minimum measured width and height, in CSS px, for a target rect to count as
 * live (improvement 02). A rect below this is "mounted but empty" (a revealed
 * panel with no content, like the Print panel with no layouts), so the auto-
 * skip treats it like a missing target. measureTarget already nulls a 0×0 rect;
 * this catches the near-empty case above zero.
 */
export const LIVE_RECT_MIN_SIZE = 4;
