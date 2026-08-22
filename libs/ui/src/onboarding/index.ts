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
export { createController } from './controller';
export type { OnboardingController, ControllerListener } from './controller';
