/* ==========================================================================
   Membership selector (Phase 2).

   Computes the tour for the open viewer at runtime. It reads the enabled
   component types (from config_json.components[]), keeps the catalog steps
   whose component is on, evaluates any step condition, and sorts by order.

   Membership is by component TYPE presence, regardless of the mount slot. A
   viewer with fewer tools yields a shorter tour. An absent component yields no
   step. A step with many components (scale:intro) stays when ANY of them is on.

   This is a runtime selection, not a build-time one. config_json is per-viewer
   DB data loaded at startup.
   ========================================================================== */

import type { OnboardingStep } from '@scalargis/ui';
import {
  baseCatalog,
  catalogToStep,
  type OnboardingCatalogEntry,
} from './catalog';
import { evaluateCondition, type ConditionContext } from './conditions';

function byOrder(a: OnboardingCatalogEntry, b: OnboardingCatalogEntry): number {
  return (a.order ?? 100) - (b.order ?? 100);
}

/**
 * Keep the catalog entries whose component is enabled and whose condition
 * passes, sorted by order.
 */
export function selectTourEntries(
  catalog: readonly OnboardingCatalogEntry[],
  enabledTypes: Iterable<string>,
  ctx: ConditionContext,
): OnboardingCatalogEntry[] {
  const enabled = new Set(enabledTypes);
  return catalog
    .filter((entry) => entry.components.some((type) => enabled.has(type)))
    .filter((entry) => evaluateCondition(entry.condition, ctx))
    .sort(byOrder);
}

/** The same selection, mapped to runtime OnboardingStep objects. */
export function selectTourSteps(
  catalog: readonly OnboardingCatalogEntry[],
  enabledTypes: Iterable<string>,
  ctx: ConditionContext,
): OnboardingStep[] {
  return selectTourEntries(catalog, enabledTypes, ctx).map(catalogToStep);
}

/** Read the enabled component types from a viewer's config_json.components[]. */
export function enabledComponentTypes(components: unknown): string[] {
  if (!Array.isArray(components)) return [];
  const types: string[] = [];
  for (const c of components) {
    const type = (c as { type?: unknown })?.type;
    if (typeof type === 'string' && type) types.push(type);
  }
  return types;
}

/** Convenience: the default base catalog selection for a viewer. */
export function selectBaseTourSteps(
  enabledTypes: Iterable<string>,
  ctx: ConditionContext,
): OnboardingStep[] {
  return selectTourSteps(baseCatalog, enabledTypes, ctx);
}
