/* ==========================================================================
   Onboarding (viewer) — public API for the base catalog, membership, and i18n.

   The engine (provider, overlay, TourTarget) lives in @scalargis/ui. This
   module holds the viewer's content and the runtime selection: the base
   catalog, the loader, the membership selector, the named conditions, and the
   i18n bundle. Phase 5 merges self steps from component exports on top.
   ========================================================================== */

export { baseCatalog, catalogToStep, primaryComponentOf } from './catalog';
export type { OnboardingCatalogEntry } from './catalog';

export { conditions, evaluateCondition } from './conditions';
export type { ConditionContext, ConditionPredicate } from './conditions';

export {
  selectTourEntries,
  selectTourSteps,
  selectBaseTourSteps,
  enabledComponentTypes,
} from './membership';

export { registerOnboardingTranslations } from './i18n';
export { useOnboardingSteps } from './useOnboardingSteps';

export {
  PANEL_STEPS,
  panelRevealByStepId,
  mainmenuButtonStep,
  mainmenuPanelStep,
  regionStep,
} from './targets';

export { attachRevealHooks } from './hooks';
export type { RevealHooksContext } from './hooks';
