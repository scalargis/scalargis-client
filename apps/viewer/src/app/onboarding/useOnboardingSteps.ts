/* ==========================================================================
   useOnboardingSteps — the viewer's tour steps for the open viewer.

   Thin hook over the pure membership selector. Registers the onboarding i18n
   bundles (idempotent, at runtime so i18next is already initialized), reads
   the enabled component types from config_json.components[], and returns the
   sorted, condition-filtered runtime steps.

   Returns [] while the viewer still loads (no config_json yet).

   The memo is keyed on a stable signature — viewer id, component-type key,
   auth token, is_owner flag, and the core reference — so a selected_menu
   change does NOT rebuild the steps. If it did, the panel reveal hook (which
   changes selected_menu on purpose) would kill the tour.
   ========================================================================== */

import { useMemo } from 'react';
import type { OnboardingStep } from '@scalargis/ui';
import { registerOnboardingTranslations } from './i18n';
import { selectBaseTourSteps, enabledComponentTypes } from './membership';
import type { ConditionContext } from './conditions';
import { attachRevealHooks, attachPanelRevealForType } from './hooks';
import type { RevealHooksContext } from './hooks';
import { applyTourSections, tourSections } from './sections';

function byOrder(a: OnboardingStep, b: OnboardingStep): number {
  return (a.order ?? 100) - (b.order ?? 100);
}

interface ViewerLike {
  id?: string | number | null;
  is_owner?: boolean | null;
  config_json?: { components?: unknown; onboarding?: unknown } | null;
}

type AuthLike = ConditionContext['auth'];

interface CoreLike {
  store?: { dispatch?: (a: unknown) => unknown; getState?: () => unknown };
  actions?: {
    viewer_set_selectedmenu?: (id: string) => unknown;
    layout_show_menu?: (isDesktop: boolean) => unknown;
    layout_toggle_menu?: (isDesktop: boolean) => unknown;
  };
  /** Phase 5: self onboarding steps by component type. */
  getOnboardingSelfSteps?: () => Record<string, OnboardingStep[]>;
}

export function useOnboardingSteps(
  viewer: ViewerLike | null | undefined,
  auth: AuthLike,
  core?: CoreLike,
): OnboardingStep[] {
  // Runtime registration: initTranslations() has already run (Core.jsx),
  // so addResourceBundle merges into the live i18next instance.
  registerOnboardingTranslations();

  // Stable signature: selected_menu is deliberately absent so a panel
  // reveal (which dispatches viewer_set_selectedmenu and creates a new
  // viewer object in the reducer) does not rebuild the steps and end the tour.
  const typesKey = enabledComponentTypes(viewer?.config_json?.components).join('|');
  const token = auth?.data?.token || '';
  const isOwner = !!viewer?.is_owner;
  const viewerId = viewer?.id ?? null;

  // Self steps register asynchronously as each outside component's Main.jsx
  // import resolves (Core.addComponent). The registry object is stable, so its
  // keys are the signal: when a self component registers, selfKey changes and
  // the memo rebuilds with the now-present self steps.
  const selfMap = core?.getOnboardingSelfSteps?.() ?? {};
  const selfKey = Object.keys(selfMap).sort().join('|');
  const sections = tourSections(viewer?.config_json);
  const sectionsKey = sections ? sections.join('|') : '';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const types = enabledComponentTypes(viewer?.config_json?.components);
    const enabledSet = new Set(types);
    const ctx: ConditionContext = { auth, viewer };
    const baseSteps = selectBaseTourSteps(types, ctx);

    // Self steps: keep only enabled component types, clone each step so the
    // per-viewer reveal hooks never mutate the component's shared exported
    // array (the same array serves every viewer this session).
    const selfByType: Record<string, OnboardingStep[]> = {};
    const selfSteps: OnboardingStep[] = [];
    for (const [type, steps] of Object.entries(selfMap)) {
      if (!enabledSet.has(type)) continue;
      if (!Array.isArray(steps)) continue;
      const cloned = steps.map((s) => ({ ...s }));
      selfByType[type] = cloned;
      selfSteps.push(...cloned);
    }

    if (core?.store && core?.actions?.viewer_set_selectedmenu) {
      const revealCtx: RevealHooksContext = {
        components: (viewer?.config_json?.components || []) as RevealHooksContext['components'],
        dispatch: (a: unknown) => core.store!.dispatch!(a),
        setSelectedMenu: (id: string) => core.actions!.viewer_set_selectedmenu!(id),
        getSelectedMenu: () => {
          const state = core.store!.getState!() as Record<string, unknown> | undefined;
          const root = state?.root as Record<string, unknown> | undefined;
          const v = root?.viewer as Record<string, unknown> | undefined;
          const cj = v?.config_json as Record<string, unknown> | undefined;
          return (cj?.selected_menu as string) ?? null;
        },
        // Open the mainmenu sidebar. No-op when layout_show_menu is absent
        // (embedded shell). The viewer app always has it.
        showMenu: core?.actions?.layout_show_menu
          ? () => core.store!.dispatch!(core.actions!.layout_show_menu!(true))
          : () => undefined,
        // Collapse the static sidebar again. layout_toggle_menu(true) toggles
        // staticMenuInactive on a static layout. No-op in an embedded shell.
        hideMenu: core?.actions?.layout_toggle_menu
          ? () => core.store!.dispatch!(core.actions!.layout_toggle_menu!(true))
          : () => undefined,
        isSidebarClosed: () => {
          const state = core.store!.getState!() as Record<string, unknown> | undefined;
          const root = state?.root as Record<string, unknown> | undefined;
          const v = root?.viewer as Record<string, unknown> | undefined;
          return !!v?.staticMenuInactive && v?.layoutMode === 'static';
        },
        // Mobile drawer path (bugs/04). ≤ 1024px is the layout mobile
        // breakpoint (sass/_responsive.scss), the inverse of core isDesktop().
        isMobile: () =>
          typeof window !== 'undefined' && window.innerWidth <= 1024,
        isMobileMenuClosed: () => {
          const state = core.store!.getState!() as Record<string, unknown> | undefined;
          const root = state?.root as Record<string, unknown> | undefined;
          const v = root?.viewer as Record<string, unknown> | undefined;
          return !(v?.mobileMenuActive as boolean | undefined);
        },
        // layout_show_menu(false) toggles the mobile drawer on when it is
        // closed; layout_toggle_menu(false) toggles it off. Both no-op when
        // the action is absent (embedded shell).
        openMobileMenu: core?.actions?.layout_show_menu
          ? () => core.store!.dispatch!(core.actions!.layout_show_menu!(false))
          : () => undefined,
        closeMobileMenu: core?.actions?.layout_toggle_menu
          ? () => core.store!.dispatch!(core.actions!.layout_toggle_menu!(false))
          : () => undefined,
      };
      attachRevealHooks(baseSteps, revealCtx);
      // Each self component's steps spotlight its own mainmenu panel. Reveal
      // that panel before each of its steps, keyed on the component type.
      for (const [type, steps] of Object.entries(selfByType)) {
        attachPanelRevealForType(steps, type, revealCtx);
      }
    }

    // Merge base + self and sort by order (the controller sorts too, but the
    // launcher reads this list, so keep it ordered). A sections list picks the
    // parts and their order.
    const merged = sections ? applyTourSections(baseSteps, selfByType, sections) : [...baseSteps, ...selfSteps];
    return merged.sort(byOrder);
  }, [viewerId, typesKey, token, isOwner, selfKey, sectionsKey, core]);
}
