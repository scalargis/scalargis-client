/* ==========================================================================
   localStorage persistence for onboarding tour progress.

   Key:  sg:ob:viewer:<viewerId>  →  { completed: boolean, lastStepId: string | null }

   Progress persists by step id, not by list index. The step list is dynamic:
   its membership changes with the auth token, the is_owner flag, and the viewer
   config (useOnboardingSteps deps). A saved index can point at a different step
   in the next session, so resume by index lands on the wrong step in silence.
   The step id is stable, so resume resolves the id to the current index and
   drops it when the id is gone. This is the same id the TourTarget registry uses.
   ========================================================================== */

import type { OnboardingState } from './types';

const KEY_PREFIX = 'sg:ob:viewer:';

function stateKey(viewerId: string): string {
  return `${KEY_PREFIX}${viewerId}`;
}

/** Read the persisted state for a viewer. Returns null when nothing is saved. */
export function getState(viewerId: string): OnboardingState | null {
  try {
    const raw = localStorage.getItem(stateKey(viewerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    if (
      typeof parsed.completed === 'boolean' &&
      (typeof parsed.lastStepId === 'string' || parsed.lastStepId === null)
    ) {
      return parsed;
    }
    // A value from an older build stored lastStep as a number. It does not
    // match the id shape, so drop it and start fresh.
    return null;
  } catch {
    return null;
  }
}

/** Persist state for a viewer. */
export function setState(
  viewerId: string,
  state: OnboardingState,
): void {
  try {
    localStorage.setItem(stateKey(viewerId), JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Whether the user has completed or dismissed this tour. */
export function isCompleted(viewerId: string): boolean {
  return getState(viewerId)?.completed ?? false;
}

/** Mark the tour as completed. */
export function markCompleted(viewerId: string): void {
  const existing = getState(viewerId);
  setState(viewerId, {
    completed: true,
    lastStepId: existing?.lastStepId ?? null,
  });
}

/** Get the id of the last active step, or null when nothing is persisted. */
export function getLastStepId(viewerId: string): string | null {
  return getState(viewerId)?.lastStepId ?? null;
}

/** Update the last-step id so the tour can resume. */
export function setLastStepId(viewerId: string, id: string): void {
  const existing = getState(viewerId);
  setState(viewerId, {
    completed: existing?.completed ?? false,
    lastStepId: id,
  });
}

/** Clear all persisted state for a viewer. */
export function resetState(viewerId: string): void {
  try {
    localStorage.removeItem(stateKey(viewerId));
  } catch {
    // Silently ignore
  }
}

/**
 * Resolve the persisted step id to an index in the current step list. Returns
 * the index of the saved step, or 0 when nothing is saved or the saved step is
 * no longer a member. A membership change between sessions (login, is_owner, or
 * a config change) drops steps from the list; when it drops the saved step, the
 * tour restarts from the first live step instead of resuming on a stranger.
 * Does not clear the saved state; the controller decides.
 */
export function resolveLastStep(
  viewerId: string,
  steps: readonly { id: string }[],
): number {
  const id = getLastStepId(viewerId);
  if (!id) return 0;
  const idx = steps.findIndex((s) => s.id === id);
  return idx > 0 ? idx : 0;
}
