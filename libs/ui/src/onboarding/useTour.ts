/* ==========================================================================
   useTour — imperative control surface for the tour engine.

   Exposes start, next, prev, skip, goTo, end and the reactive active /
   currentIndex / currentStep. Reads the controller through useSyncExternalStore
   so the consuming component re-renders on every state change.
   ========================================================================== */

import { useCallback, useContext, useSyncExternalStore } from 'react';
import { TourContext, type TourContextValue } from './TourContext';
import type { OnboardingController } from './controller';
import type { OnboardingStep } from './types';

function useTourContext(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error(
      'useTour must be used inside a <TourProvider>. ' +
        'Wrap the viewer shell with <TourProvider> in core/containers/Viewer.jsx.',
    );
  }
  return ctx;
}

export interface TourHandle {
  /** Start or restart the tour. */
  start: OnboardingController['start'];
  /** Move to the next step. */
  next: OnboardingController['next'];
  /** Move to the previous step. */
  prev: OnboardingController['prev'];
  /** Skip the tour (dismiss, mark completed). */
  skip: OnboardingController['skip'];
  /** Jump to a step by index. */
  goTo: OnboardingController['goTo'];
  /** Tear down the tour without marking it completed. */
  end: OnboardingController['end'];
  /** Whether the tour overlay is active. */
  active: boolean;
  /** Current step index (0-based). -1 when not started. */
  currentIndex: number;
  /** The active step object, or null when idle. */
  currentStep: OnboardingStep | null;
  /** The sorted step list. */
  steps: readonly OnboardingStep[];
}

export function useTour(): TourHandle {
  const { controller } = useTourContext();

  const active = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        const unsub = controller.subscribe(() => onStoreChange());
        return unsub;
      },
      [controller],
    ),
    () => controller.active,
  );

  const currentIndex = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        const unsub = controller.subscribe(() => onStoreChange());
        return unsub;
      },
      [controller],
    ),
    () => controller.currentIndex,
  );

  const currentStep: OnboardingStep | null =
    active && currentIndex >= 0 && currentIndex < controller.steps.length
      ? controller.steps[currentIndex]
      : null;

  return {
    start: useCallback(
      (...args: Parameters<OnboardingController['start']>) =>
        controller.start(...args),
      [controller],
    ),
    next: useCallback(
      (...args: Parameters<OnboardingController['next']>) =>
        controller.next(...args),
      [controller],
    ),
    prev: useCallback(
      (...args: Parameters<OnboardingController['prev']>) =>
        controller.prev(...args),
      [controller],
    ),
    skip: useCallback(
      (...args: Parameters<OnboardingController['skip']>) =>
        controller.skip(...args),
      [controller],
    ),
    goTo: useCallback(
      (...args: Parameters<OnboardingController['goTo']>) =>
        controller.goTo(...args),
      [controller],
    ),
    end: useCallback(
      (...args: Parameters<OnboardingController['end']>) =>
        controller.end(...args),
      [controller],
    ),
    active,
    currentIndex,
    currentStep,
    steps: controller.steps,
  };
}
