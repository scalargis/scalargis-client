/* ==========================================================================
   TourContext — the React context for the onboarding engine.

   Extracted to its own file so TourOverlay, TourTarget, and useTour can all
   import it without creating a cycle through TourProvider.
   ========================================================================== */

import { createContext } from 'react';
import type { OnboardingController } from './controller';
import type { OnboardingStep } from './types';

export interface TourContextValue {
  controller: OnboardingController;
  /** Map from step id to the DOM element registered by TourTarget. */
  registry: Map<string, HTMLElement>;
  /** The sorted step list. */
  steps: readonly OnboardingStep[];
}

export const TourContext = createContext<TourContextValue | null>(null);
