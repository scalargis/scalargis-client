import { useCallback } from 'react';
import { useOptionalTour, stepInFlow } from '@scalargis/ui';

/** Tells if the viewer config turns on the tour and lists the component type in onboarding.component_tours. */
export function componentTourListed(configJson, type) {
  const onboarding = configJson?.onboarding;
  if (onboarding?.enabled !== true || !type) return false;
  const list = onboarding.component_tours;
  return Array.isArray(list) && list.includes(type);
}

/** Gives the own tour of a component: available when the viewer lists the type and the flow has steps. */
export function useComponentTour({ viewer, type, flow }) {
  const tour = useOptionalTour();
  const available = !!tour
    && componentTourListed(viewer?.config_json, type)
    && tour.steps.some(s => stepInFlow(s, flow));
  const start = useCallback(() => { if (tour) tour.start({ flow }); }, [tour, flow]);
  return { available, start };
}
