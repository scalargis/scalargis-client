/* =====================================================================
   useIsMobile — the one home for the "is this a small screen?" test.

   The `wsize[0] <= 768` check was copy-pasted across ~18 files, each
   reading the non-reactive getWindowSize() store (a plain snapshot that
   does not re-render on resize). This hook centralises the 768 breakpoint
   AND makes it reactive: it rides @mantine/hooks' useMediaQuery, so a
   component using it re-renders when the viewport crosses the boundary
   (rotate a tablet, drag a window) — which the old snapshot never did.

   768 is the ADS `md` breakpoint (ads-tokens.css --bp-md); it lives here
   once, as the default argument.
   ===================================================================== */

import { useMediaQuery } from '@mantine/hooks';

/**
 * True when the viewport is at or below `bp` px wide. Reactive: re-renders
 * on resize. SSR-safe — resolves to `false` until the media query can be
 * evaluated (the desktop assumption, matching the old snapshot's default).
 */
export function useIsMobile(bp = 768): boolean {
  return useMediaQuery(`(max-width: ${bp}px)`, false) ?? false;
}
