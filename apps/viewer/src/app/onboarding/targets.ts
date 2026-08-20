/* ==========================================================================
   Component-to-step-id map (Phase 3).

   Builds three static lookups from the base catalog at module load so the
   Core.jsx render sites can resolve a component type + slot to its spotlight
   step id without walking the catalog on every render.

   The map distinguishes mainmenu buttons from mainmenu panels. A panel step
   (toc:intro) spotlights the <div> behind the menu button, not the button
   itself. The choice comes from the help-base Alvo column, kept here in
   PANEL_STEPS.

   regionStep covers the other slots: topbar_right, footer_left, footer_right,
   map_controls_top_left, map_controls_left, and any future slot.
   ========================================================================== */

import { baseCatalog, primaryComponentOf } from './catalog';

/**
 * Mainmenu steps that spotlight the panel content (the <div> behind the button),
 * not the always-visible menu button. Each of these needs a before/after hook
 * that reveals the panel so the spotlight measurement lands on a painted node.
 */
export const PANEL_STEPS: ReadonlySet<string> = new Set(['toc:intro']);

/**
 * For each panel step, the component type whose mainmenu panel gets revealed.
 * Derived from PANEL_STEPS so a future second panel step adds its id in both
 * places.
 */
export const panelRevealByStepId: Record<string, string> = {
  'toc:intro': 'TOC',
};

/* ------------------------------------------------------------------------ */
/*  Static lookup tables, filled once at module load                        */
/* ------------------------------------------------------------------------ */

type StringMap = Record<string, string | undefined>;

const buttonByType: StringMap = {};
const panelByType: StringMap = {};
const regionByKey: StringMap = {};

for (const entry of baseCatalog) {
  const slot = entry.target;

  for (const compType of entry.components) {
    if (slot === 'mainmenu') {
      if (PANEL_STEPS.has(entry.id)) {
        panelByType[compType] = entry.id;
      } else {
        buttonByType[compType] = entry.id;
      }
    } else {
      regionByKey[`${compType}::${slot}`] = entry.id;
    }
  }
}

/* ------------------------------------------------------------------------ */
/*  Public lookups                                                          */
/* ------------------------------------------------------------------------ */

/** Step id for a mainmenu button spotlight, or undefined. */
export function mainmenuButtonStep(type: string): string | undefined {
  return buttonByType[type];
}

/** Step id for a mainmenu panel spotlight, or undefined. */
export function mainmenuPanelStep(type: string): string | undefined {
  return panelByType[type];
}

/** Step id for a region slot (topbar, footer, map controls) spotlight. */
export function regionStep(type: string, slot: string): string | undefined {
  return regionByKey[`${type}::${slot}`];
}
