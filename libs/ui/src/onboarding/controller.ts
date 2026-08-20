/* ==========================================================================
   Onboarding tour state machine.

   Owns the lifecycle:
     1. Take explicit steps (sorted by order).
     2. Check persistence (resume where left off, unless reset).
     3. Drive the tour: start / next / prev / skip / goTo / end.
     4. Run step.before() / after() hooks. The before hook is awaited so the
        renderer can measure after the DOM settles (D12).

   The controller owns lifecycle and persistence. The renderer (TourOverlay)
   reads the controller through useSyncExternalStore and draws the visual
   layer — the overlay, the spotlight cutout, and the popover card.
   ========================================================================== */

import type { OnboardingStep } from './types';
import {
  isCompleted,
  markCompleted,
  resetState,
  setLastStep,
  validateLastStep,
} from './persistence';

function byOrder(a: OnboardingStep, b: OnboardingStep): number {
  return (a.order ?? 100) - (b.order ?? 100);
}

/* --------------------------------------------------------------------------
   Controller type
   -------------------------------------------------------------------------- */

export type ControllerListener = (ctrl: OnboardingController) => void;

export interface OnboardingController {
  /** The viewer id this controller persists under. */
  readonly viewerId: string;
  /** Resolved steps for this tour (sorted). */
  readonly steps: readonly OnboardingStep[];
  /** Current step index (0-based). -1 when the tour is not started. */
  readonly currentIndex: number;
  /** Whether the tour overlay is active. */
  readonly active: boolean;

  /** Start or restart the tour. Awaits the first step's before hook. */
  start(): Promise<void>;
  /** Move to the next step. Completes the tour past the last step. */
  next(): Promise<void>;
  /** Move to the previous step. Stays at 0 on underflow. */
  prev(): Promise<void>;
  /** Skip the tour (dismiss). */
  skip(): void;
  /** Jump to a specific step by index. */
  goTo(index: number): Promise<void>;
  /** Tear down the tour without marking it completed. */
  end(): void;

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(fn: ControllerListener): () => void;
  /** Remove all listeners and clean up. */
  destroy(): void;
}

/* --------------------------------------------------------------------------
   Implementation
   -------------------------------------------------------------------------- */

export function createController(
  viewerId: string,
  explicitSteps: readonly OnboardingStep[],
  options?: { reset?: boolean },
): OnboardingController {
  const steps = [...explicitSteps].sort(byOrder);

  if (options?.reset) {
    resetState(viewerId);
  }

  let currentIndex = -1;
  let active = false;
  const listeners = new Set<ControllerListener>();

  function notify(): void {
    for (const fn of listeners) fn(ctrl);
  }

  function persistCurrentStep(): void {
    if (currentIndex >= 0) setLastStep(viewerId, currentIndex);
  }

  async function doBefore(step: OnboardingStep): Promise<void> {
    if (!step.before) return;
    try {
      await step.before();
    } catch {
      // Swallow — a hook must never break the tour
    }
  }

  function doAfter(step: OnboardingStep): void {
    if (!step.after) return;
    try {
      step.after();
    } catch {
      // Swallow
    }
  }

  const ctrl: OnboardingController = {
    viewerId,
    steps,
    get currentIndex() {
      return currentIndex;
    },
    get active() {
      return active;
    },

    async start() {
      if (steps.length === 0) return;

      // P1 (Phase 4): a finished tour restarts from the top. start() must
      // not reopen on the last step. resetState clears the completed flag and
      // the saved lastStep so this run tracks and completes cleanly. A
      // partly-done tour (not completed) still resumes from its last step.
      const restart = !!options?.reset || isCompleted(viewerId);
      if (restart) resetState(viewerId);
      const startIdx = restart ? 0 : validateLastStep(viewerId, steps.length);

      const step = steps[startIdx];
      if (step) await doBefore(step);

      active = true;
      currentIndex = startIdx;
      persistCurrentStep();
      notify();
    },

    async next() {
      if (!active) return;
      const current = steps[currentIndex];
      if (current) doAfter(current);

      const nextIdx = currentIndex + 1;
      if (nextIdx >= steps.length) {
        markCompleted(viewerId);
        active = false;
        notify();
        return;
      }

      const step = steps[nextIdx];
      if (step) await doBefore(step);

      currentIndex = nextIdx;
      persistCurrentStep();
      notify();
    },

    async prev() {
      if (!active || currentIndex <= 0) return;
      const current = steps[currentIndex];
      if (current) doAfter(current);

      const prevIdx = currentIndex - 1;
      const step = steps[prevIdx];
      if (step) await doBefore(step);

      currentIndex = prevIdx;
      persistCurrentStep();
      notify();
    },

    skip() {
      if (!active) return;
      const current = steps[currentIndex];
      if (current) doAfter(current);

      markCompleted(viewerId);
      active = false;
      notify();
    },

    async goTo(index: number) {
      if (!active || index < 0 || index >= steps.length) return;
      if (index === currentIndex) return;

      const current = steps[currentIndex];
      if (current) doAfter(current);

      const step = steps[index];
      if (step) await doBefore(step);

      currentIndex = index;
      persistCurrentStep();
      notify();
    },

    end() {
      if (active) {
        const current = steps[currentIndex];
        if (current) doAfter(current);
      }
      active = false;
      notify();
    },

    subscribe(fn: ControllerListener) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },

    destroy() {
      listeners.clear();
    },
  };

  return ctrl;
}
