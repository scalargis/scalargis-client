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
import { attachRevealHooks } from './hooks';
import type { RevealHooksContext } from './hooks';

interface ViewerLike {
  id?: string | number | null;
  is_owner?: boolean | null;
  config_json?: { components?: unknown } | null;
}

type AuthLike = ConditionContext['auth'];

interface CoreLike {
  store?: { dispatch?: (a: unknown) => unknown; getState?: () => unknown };
  actions?: {
    viewer_set_selectedmenu?: (id: string) => unknown;
    layout_show_menu?: (isDesktop: boolean) => unknown;
  };
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const types = enabledComponentTypes(viewer?.config_json?.components);
    const ctx: ConditionContext = { auth, viewer };
    const steps = selectBaseTourSteps(types, ctx);

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
        isSidebarClosed: () => {
          const state = core.store!.getState!() as Record<string, unknown> | undefined;
          const v = state?.root?.viewer as Record<string, unknown> | undefined;
          return !!(v as Record<string, unknown> | undefined)?.staticMenuInactive
            && (v as Record<string, unknown> | undefined)?.layoutMode === 'static';
        },
      };
      attachRevealHooks(steps, revealCtx);
    }

    return steps;
  }, [viewerId, typesKey, token, isOwner, core]);
}
