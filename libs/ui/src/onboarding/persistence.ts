/* ==========================================================================
   localStorage persistence for onboarding tour progress.

   Key:  sg:ob:viewer:<viewerId>  →  { completed: boolean, lastStep: number }
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
      typeof parsed.lastStep === 'number'
    ) {
      return parsed;
    }
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
    lastStep: existing?.lastStep ?? 0,
  });
}

/** Get the index of the last active step, or 0 when nothing is persisted. */
export function getLastStep(viewerId: string): number {
  return getState(viewerId)?.lastStep ?? 0;
}

/** Update the last-step index so the tour can resume. */
export function setLastStep(viewerId: string, step: number): void {
  const existing = getState(viewerId);
  setState(viewerId, {
    completed: existing?.completed ?? false,
    lastStep: step,
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
 * Validate a persisted lastStep against the current step list.
 * When the saved index is out of range (the config dropped that step's
 * component), reset to 0 so the tour starts at the first live step.
 */
export function validateLastStep(
  viewerId: string,
  stepCount: number,
): number {
  const last = getLastStep(viewerId);
  if (last > 0 && last < stepCount) return last;
  // Out of range or never started — start fresh.
  // Don't clear the saved state here; the controller decides.
  return 0;
}
