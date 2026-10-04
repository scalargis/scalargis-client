/* ==========================================================================
   Onboarding engine — public API.

   Import from '@scalargis/ui' (the lib barrel re-exports these symbols).
   ========================================================================== */

export { default as TourProvider } from './TourProvider';
export { TourContext } from './TourContext';
export type { TourContextValue } from './TourContext';
export { default as TourTarget } from './TourTarget';
export { useTour, useOptionalTour } from './useTour';
export type { TourHandle } from './useTour';
export { OVERLAY_Z, POPOVER_Z, LIVE_RECT_MIN_SIZE } from './constants';
export type {
  OnboardingStep,
  OnboardingState,
  OnboardingLabels,
  PopoverPosition,
} from './types';
export { createController, stepInFlow } from './controller';
export type { OnboardingController, ControllerListener } from './controller';
// Clear the persisted progress for a viewer, keyed by flow. A launcher that
// resets a scoped run on exit calls this, so it never reconstructs the storage
// key by hand.
export {
  resetState as resetTourState,
  setLastStepId as setTourLastStep,
} from './persistence';
