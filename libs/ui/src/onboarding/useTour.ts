/* ==========================================================================
   useTour / useOptionalTour — imperative control surface for the tour engine.

   Exposes start, next, prev, skip, goTo, end and the reactive active /
   currentIndex / currentStep. Reads the controller through useSyncExternalStore
   so the consuming component re-renders on every state change.

   useTour throws when no <TourProvider> sits above (catches dev misuse).
   useOptionalTour returns null instead, so a launcher that also mounts in the
   embedded shell (no provider, no tour) does not crash. The launcher reads the
   optional form.
   ========================================================================== */

import { useCallback, useContext, useSyncExternalStore } from 'react';
import { TourContext } from './TourContext';
import type { OnboardingController } from './controller';
import type { OnboardingStep } from './types';

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

/**
 * Tour handle, or null when no <TourProvider> sits above. Every hook runs
 * unconditionally (Rules of Hooks); the null guard sits below them. When the
 * controller is null the store snapshots return idle defaults and the methods
 * no-op, so a caller in a provider-free tree never crashes.
 */
export function useOptionalTour(): TourHandle | null {
  const ctx = useContext(TourContext);
  const controller: OnboardingController | null = ctx?.controller ?? null;

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      controller ? controller.subscribe(() => onStoreChange()) : () => undefined,
    [controller],
  );

  const active = useSyncExternalStore(
    subscribe,
    () => controller?.active ?? false,
  );
  const currentIndex = useSyncExternalStore(
    subscribe,
    () => controller?.currentIndex ?? -1,
  );

  const start = useCallback(
    (...args: Parameters<OnboardingController['start']>) =>
      controller ? controller.start(...args) : Promise.resolve(),
    [controller],
  );
  const next = useCallback(
    (...args: Parameters<OnboardingController['next']>) =>
      controller ? controller.next(...args) : Promise.resolve(),
    [controller],
  );
  const prev = useCallback(
    (...args: Parameters<OnboardingController['prev']>) =>
      controller ? controller.prev(...args) : Promise.resolve(),
    [controller],
  );
  const skip = useCallback(
    (...args: Parameters<OnboardingController['skip']>) => {
      if (controller) controller.skip(...args);
    },
    [controller],
  );
  const goTo = useCallback(
    (...args: Parameters<OnboardingController['goTo']>) =>
      controller ? controller.goTo(...args) : Promise.resolve(),
    [controller],
  );
  const end = useCallback(
    (...args: Parameters<OnboardingController['end']>) => {
      if (controller) controller.end(...args);
    },
    [controller],
  );

  if (!controller) return null;

  const currentStep: OnboardingStep | null =
    active && currentIndex >= 0 && currentIndex < controller.steps.length
      ? controller.steps[currentIndex]
      : null;

  return {
    start,
    next,
    prev,
    skip,
    goTo,
    end,
    active,
    currentIndex,
    currentStep,
    steps: controller.steps,
  };
}

export function useTour(): TourHandle {
  const handle = useOptionalTour();
  if (!handle) {
    throw new Error(
      'useTour must be used inside a <TourProvider>. ' +
        'Wrap the viewer shell with <TourProvider> in core/containers/Viewer.jsx, ' +
        'or use useOptionalTour() where the provider may be absent.',
    );
  }
  return handle;
}
