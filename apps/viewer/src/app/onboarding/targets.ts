/* ==========================================================================
   Component-to-step-id map (Phase 3, improvement 01).

   Builds three static lookups from the base catalog at module load so the
   Core.jsx render sites can resolve a component type + slot to its spotlight
   step id without walking the catalog on every render.

   Each mainmenu tool has two steps (improvement 01): a button step that
   spotlights the round menu button, and a panel step that spotlights the
   revealed panel content (the <div> behind the button). The two are told
   apart by the catalog `kind` field, not by a static id list. A panel step
   needs a before/after reveal hook, so the panel measurement lands on a
   painted node; panelRevealByStepId maps each panel step id to the component
   type whose mainmenu panel it reveals.

   regionStep covers the other slots: topbar_right, footer_left, footer_right,
   map_controls_top_left, map_controls_left, and any future slot.
   ========================================================================== */

import { baseCatalog, primaryComponentOf } from './catalog';

/* ------------------------------------------------------------------------ */
/*  Static lookup tables, filled once at module load                        */
/* ------------------------------------------------------------------------ */

type StringMap = Record<string, string | undefined>;

const buttonByType: StringMap = {};
const panelByType: StringMap = {};
const regionByKey: StringMap = {};

/**
 * For each mainmenu panel step, the component type whose panel gets revealed.
 * Built from the catalog (every panel-kind mainmenu entry), so a new tool with
 * a panel step is covered without touching this file. hooks.ts reads it to
 * attach the reveal before/after pair.
 */
export const panelRevealByStepId: Record<string, string> = {};

for (const entry of baseCatalog) {
  const slot = entry.target;

  for (const compType of entry.components) {
    if (slot === 'mainmenu') {
      if (entry.kind === 'panel') {
        panelByType[compType] = entry.id;
      } else {
        buttonByType[compType] = entry.id;
      }
    } else {
      regionByKey[`${compType}::${slot}`] = entry.id;
    }
  }

  // A mainmenu panel step reveals the panel of its primary component.
  if (slot === 'mainmenu' && entry.kind === 'panel') {
    const revealType = primaryComponentOf(entry);
    if (revealType) panelRevealByStepId[entry.id] = revealType;
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
