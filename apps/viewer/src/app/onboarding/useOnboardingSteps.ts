/* ==========================================================================
   useOnboardingSteps — the viewer's tour steps for the open viewer.

   Thin hook over the pure membership selector. Registers the onboarding i18n
   bundles (idempotent, at runtime so i18next is already initialized), reads
   the enabled component types from config_json.components[], and returns the
   sorted, condition-filtered runtime steps.

   Returns [] while the viewer still loads (no config_json yet). The result is
   memoized on [viewer, auth], so the provider only rebuilds the controller
   when the open viewer or the session changes.
   ========================================================================== */

import { useMemo } from 'react';
import type { OnboardingStep } from '@scalargis/ui';
import { registerOnboardingTranslations } from './i18n';
import { selectBaseTourSteps, enabledComponentTypes } from './membership';
import type { ConditionContext } from './conditions';

interface ViewerLike {
  id?: string | number | null;
  is_owner?: boolean | null;
  config_json?: { components?: unknown } | null;
}

type AuthLike = ConditionContext['auth'];

export function useOnboardingSteps(
  viewer: ViewerLike | null | undefined,
  auth: AuthLike,
): OnboardingStep[] {
  // Runtime registration: initTranslations() has already run (Core.jsx),
  // so addResourceBundle merges into the live i18next instance.
  registerOnboardingTranslations();

  return useMemo(() => {
    const types = enabledComponentTypes(viewer?.config_json?.components);
    const ctx: ConditionContext = { auth, viewer };
    return selectBaseTourSteps(types, ctx);
  }, [viewer, auth]);
}
