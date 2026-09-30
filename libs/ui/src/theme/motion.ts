/* =====================================================================
   MOTION — the central control for animation across the platform.

   THE ONE SWITCH: `FORCE_REDUCED_MOTION` below. AdsProviders stamps it
   onto <html> as data-sg-motion="reduced" | "full", and ads-globals.css
   kills all visible animation under the "reduced" stamp — the same kill
   it applies under the OS preference. Flipping the constant is the whole
   operation; no component carries its own duration.

   Two independent reduced-motion layers (both must keep working):
   1. OS/accessibility: `@media (prefers-reduced-motion: reduce)` in
      ads-globals.css (WCAG 2.3.3). Always honoured; nothing here can
      override or bypass it.
   2. Project switch: this file. Adds a way to reduce motion for every
      user without touching an OS setting.

   TOKEN FLOW — every duration in the design system originates here:
   - JS: the theme's component transitionProps (ads-mantine-theme.ts),
     the Notifications toast layer (AdsProviders), the Dialog recipe and
     any shell <Transition> read these exports.
   - CSS: adsCssVariablesResolver emits them as --sg-motion-* custom
     properties on :root. The app shells' sass ($transitionDuration) and
     the ADS token --transition-duration (ads-tokens.css) alias onto
     those, so hand-written CSS transitions follow the same clock.

   INVARIANT — durations stay > 0 even when motion is "off". The Combobox
   flicker gate (ads-mantine-theme.ts) relies on a non-zero transition
   window to measure and position dropdowns before their first visible
   paint; zeroing JS durations would bring that mispaint back for every
   overlay. "Off" therefore happens in CSS (transition/animation-duration
   0.01ms !important beats the inline styles Mantine writes), which
   removes the visible motion while leaving the JS state machines their
   measuring window. To reduce motion flip the switch — never zero these
   numbers.
   ===================================================================== */

/** Project-level motion master switch. `true` = the whole platform runs
 *  reduced-motion for every user (the OS preference path is unaffected).
 *  This is the one-liner; nothing else needs touching. */
export const FORCE_REDUCED_MOTION = false;

/** Duration tokens (ms). fast = transient overlays (dropdowns, menus,
 *  tooltips) and hover feedback; normal = panels, dialogs and shell
 *  slides; slow = large surfaces (drawers) and toasts. */
export const motionDurations = {
  fast: 120,
  normal: 200,
  slow: 300,
} as const;

/** The one easing every transition shares (Mantine's own default). */
export const motionEasing = 'ease';

/** Ready-made transitionProps per overlay family — consumed by the theme's
 *  component defaults (ads-mantine-theme.ts) and the Dialog recipe. */
export const motionTransitionProps = {
  /** Transient dropdowns (Popover, HoverCard; the Combobox flicker gate
   *  restates the same values with its own rationale). */
  dropdown: { transition: 'fade', duration: motionDurations.fast },
  /** Menus settle a few px downward on top of the fade. */
  menu: { transition: 'fade-down', duration: motionDurations.fast },
  tooltip: { transition: 'fade', duration: motionDurations.fast },
  /** Dialogs scale in — the shape Prime's Dialog had. */
  dialog: { transition: 'pop', duration: motionDurations.normal },
  /** Drawer derives its slide direction from `position`; only the pace
   *  is set here so that derivation keeps working. */
  drawer: { duration: motionDurations.slow },
} as const;

/** The CSS side of the tokens — emitted on :root by adsCssVariablesResolver
 *  (ads-mantine-theme.ts), identical under all client themes. */
export const motionCssVariables = {
  '--sg-motion-fast': `${motionDurations.fast}ms`,
  '--sg-motion-normal': `${motionDurations.normal}ms`,
  '--sg-motion-slow': `${motionDurations.slow}ms`,
  '--sg-motion-ease': motionEasing,
} as const;

/** Stamps the project switch onto the document — AdsProviders calls this on
 *  mount. "reduced" triggers the ads-globals.css kill block; "full" is
 *  stamped too so the state is inspectable in devtools (and flippable live
 *  there when testing, no rebuild needed). */
export function applyMotionPreference(
  root: HTMLElement | undefined = typeof document !== 'undefined'
    ? document.documentElement
    : undefined
) {
  if (root) root.dataset.sgMotion = FORCE_REDUCED_MOTION ? 'reduced' : 'full';
}
