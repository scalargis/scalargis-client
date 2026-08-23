/* ==========================================================================
   Onboarding tour state machine.

   Owns the lifecycle:
     1. Take explicit steps (sorted by order).
     2. Check persistence (resume where left off, unless reset).
     3. Drive the tour: start / next / prev / pause / complete / goTo / end.
     4. Run step.before() / after() hooks. The before hook is awaited so the
        renderer can measure after the DOM settles (D12).

   Dismiss semantics (improvement 04, INTENT D5): Escape and the close button
   pause() the tour. pause() keeps `completed` false and keeps the saved step
   id, so the next start() resumes. It does not run the leaving step's
   after hook, so a panel or menu the step revealed stays open and any work the
   user started under the tour is kept (freeze on dismiss). Only the final
   Complete on the last step (next() past the end) marks the tour done through
   complete().

   Auto-skip (improvement 02): the controller does not measure the DOM. The
   renderer measures each landing and calls skipDeadStep() when the target is
   not live (not mounted, or a mounted-but-empty rect). skipDeadStep() moves one
   step in the last navigation direction, so a dead step never stays on screen.
   The direction is stored in lastDir. Each move measures again through D12, so
   a step whose before() reveals a panel is measured after the panel mounts.

   The controller owns lifecycle and persistence. The renderer (TourOverlay)
   reads the controller through useSyncExternalStore and draws the visual
   layer — the overlay, the spotlight cutout, and the popover card.
   ========================================================================== */

import type { OnboardingStep } from './types';
import {
  isCompleted,
  markCompleted,
  resetState,
  resolveLastStep,
  setLastStepId,
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
  /**
   * Pause the tour (dismiss via Escape or the close button). Keeps `completed`
   * false and the saved lastStep, so the next start() resumes (improvement 04).
   */
  pause(): void;
  /** Mark the tour done. The final Complete on the last step. */
  complete(): void;
  /**
   * Deprecated alias of pause(), kept for the public useTour handle. Escape and
   * the close button used to mark the tour completed; they now pause. New code
   * calls pause() or complete().
   */
  skip(): void;
  /**
   * Skip a dead step. The renderer calls this when it measures no live target
   * on the current landing. Moves one step in lastDir (improvement 02). Returns
   * to the caller nothing; it notifies, so the renderer re-measures.
   */
  skipDeadStep(): Promise<void>;
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
  // Direction of the last navigation. The renderer-driven auto-skip
  // (skipDeadStep) moves this way, so a dead step lands the tour on the next
  // live step in the same direction the user was going (improvement 02).
  let lastDir: 1 | -1 = 1;
  const listeners = new Set<ControllerListener>();

  function notify(): void {
    for (const fn of listeners) fn(ctrl);
  }

  function persistCurrentStep(): void {
    const step = steps[currentIndex];
    if (step) setLastStepId(viewerId, step.id);
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

  /**
   * Land on a step: run its before hook, set the index, persist, notify. The
   * caller runs the leaving step's after hook first. Shared by next / prev /
   * skipDeadStep.
   */
  async function moveTo(index: number): Promise<void> {
    const step = steps[index];
    if (step) await doBefore(step);
    currentIndex = index;
    persistCurrentStep();
    notify();
  }

  /** Mark the tour done and tear the overlay down. */
  function completeInternal(): void {
    markCompleted(viewerId);
    active = false;
    notify();
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
      // the saved step so this run tracks and completes cleanly. A partly-done
      // tour (not completed) still resumes from its last step.
      const restart = !!options?.reset || isCompleted(viewerId);
      if (restart) resetState(viewerId);
      // Resume resolves the saved step id to its index in the current list. A
      // membership change since the pause (login, is_owner, config) can drop
      // that step; resolveLastStep returns 0 then, so the tour restarts from the
      // first live step instead of resuming on a different step at the old index.
      const startIdx = restart ? 0 : resolveLastStep(viewerId, steps);

      const step = steps[startIdx];
      if (step) await doBefore(step);

      active = true;
      currentIndex = startIdx;
      // A resume onto a saved step backs up if that step is now dead; a fresh
      // start at the top moves forward (improvement 02/04).
      lastDir = startIdx > 0 ? -1 : 1;
      persistCurrentStep();
      notify();
    },

    async next() {
      if (!active) return;
      lastDir = 1;
      const current = steps[currentIndex];
      if (current) doAfter(current);

      const nextIdx = currentIndex + 1;
      if (nextIdx >= steps.length) {
        completeInternal();
        return;
      }

      await moveTo(nextIdx);
    },

    async prev() {
      if (!active || currentIndex <= 0) return;
      lastDir = -1;
      const current = steps[currentIndex];
      if (current) doAfter(current);

      await moveTo(currentIndex - 1);
    },

    pause() {
      if (!active) return;
      // Dismiss freezes the viewer as-is. pause() does NOT run the leaving
      // step's after hook, so a panel or menu the step revealed stays open and
      // any work the user started under the tour is kept. The next start()
      // resumes on the same step and its before hook re-establishes the target.
      // Between-step moves (next/prev/goTo), complete() and end() still run the
      // after hook, so only a user dismiss keeps the view.
      // Keep completed false and keep the saved step id, so start() resumes.
      persistCurrentStep();
      active = false;
      notify();
    },

    complete() {
      if (!active) return;
      const current = steps[currentIndex];
      if (current) doAfter(current);
      completeInternal();
    },

    skip() {
      // Deprecated alias. Escape and the close button pause now (improvement 04).
      ctrl.pause();
    },

    async skipDeadStep() {
      if (!active) return;
      const current = steps[currentIndex];
      if (current) doAfter(current); // restore any reveal this dead step ran

      if (lastDir > 0) {
        const nextIdx = currentIndex + 1;
        // Ran out of live steps forward: the previous live step was the last,
        // so the tour completes.
        if (nextIdx >= steps.length) {
          completeInternal();
          return;
        }
        await moveTo(nextIdx);
        return;
      }

      const prevIdx = currentIndex - 1;
      if (prevIdx < 0) {
        // Nowhere to back up and this step is dead. Search forward instead, so
        // a dead first step never stays on screen.
        lastDir = 1;
        const nextIdx = currentIndex + 1;
        if (nextIdx >= steps.length) {
          completeInternal();
          return;
        }
        await moveTo(nextIdx);
        return;
      }
      await moveTo(prevIdx);
    },

    async goTo(index: number) {
      if (!active || index < 0 || index >= steps.length) return;
      if (index === currentIndex) return;

      lastDir = index > currentIndex ? 1 : -1;
      const current = steps[currentIndex];
      if (current) doAfter(current);

      await moveTo(index);
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
