/* ==========================================================================
   TourContext — the React context for the onboarding engine.

   Extracted to its own file so TourOverlay, TourTarget, and useTour can all
   import it without creating a cycle through TourProvider.
   ========================================================================== */

import { createContext } from 'react';
import type { OnboardingController } from './controller';
import type { OnboardingLabels } from './types';

export interface TourContextValue {
  controller: OnboardingController;
  /** Map from step id to the DOM element registered by TourTarget. */
  registry: Map<string, HTMLElement>;
  /**
   * Localised control labels (improvement 06). Absent → English defaults.
   * The live step list is read from `controller.steps`, not from the context.
   * The controller owns it so setSteps can swap it on a running tour (F4).
   */
  labels?: OnboardingLabels;
}

export const TourContext = createContext<TourContextValue | null>(null);
