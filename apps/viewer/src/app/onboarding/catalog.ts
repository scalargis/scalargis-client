/* ==========================================================================
   Base step catalog loader (Phase 2, D3).

   Reads the compiled-in base catalog (onboarding-index.json, 27 objects) and
   maps each row to a runtime OnboardingStep from the engine (@scalargis/ui).
   No runtime fetch. Self steps are not here; they ship from the component
   export and merge in Phase 5.

   The catalog lives in apps/viewer with the copy, not in the engine, so the
   engine stays content-free (INTENT "Base and self, in tour terms").

   This JSON is the single source of truth for the base steps. It holds only the
   fields the client reads at runtime — id, components, target, kind, order, flow,
   i18n, condition, primary_component. The human traceability view (component, help
   file, manual anchor) lives in the project docs, not here. The client is
   self-contained, so it ships none of those authoring fields.

   A base step targets one slot (the `target` field). Membership keeps a step when
   its component type is present in any slot, but the TourTarget binds only in that
   one slot. So a component mounted on a different slot than its step targets makes
   the step have no target, and the dead-step skip drops it. This is by design. All
   shipped viewers mount each tool on its step's slot, so no step goes dead in
   practice.

   title and content use the function form so the popover text follows the
   live locale (D4). The i18n key comes from each row (for example
   "onboarding.toc" resolves ".title" and ".content").
   ========================================================================== */

import i18next from 'i18next';
import type { OnboardingStep } from '@scalargis/ui';
import rawCatalog from './onboarding-index.json';

/** One row of the base catalog. Runtime fields only (see the file header). */
export interface OnboardingCatalogEntry {
  /** Step id. Equals the <TourTarget id> that wraps the element. */
  id: string;
  /** Component type keys this step covers. Membership matches by type. */
  components: string[];
  /** Default viewer-config target slot. Phase 3 wraps the mount in this slot. */
  target: string;
  /**
   * For a mainmenu step, whether it spotlights the round button or the revealed
   * panel content (improvement 01). A "button" step keeps the target clickable
   * and advances on the real click; a "panel" step gets the reveal before/after
   * hooks. Absent for non-mainmenu slots.
   */
  kind?: 'button' | 'panel';
  /** Sort order within the flow. */
  order: number;
  /** Flow membership. The viewer uses one flow: "viewer". */
  flow: string;
  /** i18n key prefix. ".title" and ".content" hang off it. */
  i18n: string;
  /** Named membership condition, bound to a predicate in conditions.ts. */
  condition?: string;
  /** For a multi-component step, the component that carries the TourTarget. */
  primary_component?: string;
}

/** The base catalog: 27 rows, compiled in. */
export const baseCatalog: OnboardingCatalogEntry[] =
  rawCatalog as unknown as OnboardingCatalogEntry[];

function tr(key: string): string {
  return i18next.t(key);
}

/**
 * The component that carries the TourTarget for a step (T7). A single-component
 * step uses that component. A multi-component step (scale:intro) names its
 * carrier in primary_component. So every step resolves to one primary
 * component, and Phase 3 wraps exactly that component's element in <TourTarget>.
 */
export function primaryComponentOf(
  entry: OnboardingCatalogEntry,
): string | undefined {
  return entry.primary_component ?? entry.components[0];
}

/** Map one catalog row to a runtime OnboardingStep (D3). */
export function catalogToStep(entry: OnboardingCatalogEntry): OnboardingStep {
  const key = entry.i18n;
  const step: OnboardingStep = {
    id: entry.id,
    order: entry.order,
    flow: entry.flow,
    title: () => tr(`${key}.title`),
    content: () => tr(`${key}.content`),
  };
  // A mainmenu button step stays clickable and advances on the real click, so
  // clicking the tool opens its panel and moves the tour to the panel step
  // (improvement 01, engine capability 07). The panel step advances on Next.
  if (entry.kind === 'button') {
    step.advanceOnTargetClick = true;
  }
  return step;
}
