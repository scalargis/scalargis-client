/* ==========================================================================
   TourContext — the React context for the onboarding engine.

   Extracted to its own file so TourOverlay, TourTarget, and useTour can all
   import it without creating a cycle through TourProvider.
   ========================================================================== */

import { createContext } from 'react';
import type { OnboardingController } from './controller';
import type { OnboardingStep, OnboardingLabels } from './types';

export interface TourContextValue {
  controller: OnboardingController;
  /** Map from step id to the DOM element registered by TourTarget. */
  registry: Map<string, HTMLElement>;
  /** The sorted step list. */
  steps: readonly OnboardingStep[];
  /** Localised control labels (improvement 06). Absent → English defaults. */
  labels?: OnboardingLabels;
}

export const TourContext = createContext<TourContextValue | null>(null);
