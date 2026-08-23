import { beforeEach, describe, expect, it } from 'vitest';

import { createController } from './controller';
import type { OnboardingStep } from './types';

/* Steps carry only id and order here; the controller does not read text. */
function step(id: string, order: number): OnboardingStep {
  return { id, order };
}

const VIEWER = 'test-viewer';

beforeEach(() => {
  localStorage.clear();
});

describe('onboarding controller — resume by step id (F3)', () => {
  it('starts a fresh tour at the first step', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20)]);
    await ctrl.start();
    expect(ctrl.currentIndex).toBe(0);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('a');
  });

  it('persists the step id and resumes on it with the same list', async () => {
    const steps = [step('a', 10), step('b', 20), step('c', 30)];
    const first = createController(VIEWER, steps);
    await first.start();
    await first.next(); // now on 'b'
    first.pause();
    expect(first.currentIndex).toBe(1);

    const resumed = createController(VIEWER, steps);
    await resumed.start();
    expect(resumed.steps[resumed.currentIndex].id).toBe('b');
  });

  it('resumes on the saved id when the list shifts, not the old index', async () => {
    // Session one: full list, pause on the third step 'c' (index 2).
    const full = [step('a', 10), step('b', 20), step('c', 30), step('d', 40)];
    const first = createController(VIEWER, full);
    await first.start();
    await first.next();
    await first.next(); // on 'c', index 2
    first.pause();
    expect(first.steps[first.currentIndex].id).toBe('c');

    // Session two: a step before 'c' dropped from membership, so 'c' is now
    // index 1. Index-based resume would land on 'd'; id-based lands on 'c'.
    const shifted = [step('a', 10), step('c', 30), step('d', 40)];
    const resumed = createController(VIEWER, shifted);
    await resumed.start();
    expect(resumed.currentIndex).toBe(1);
    expect(resumed.steps[resumed.currentIndex].id).toBe('c');
  });

  it('restarts from the first step when the saved id is gone', async () => {
    const first = createController(VIEWER, [step('a', 10), step('gone', 20)]);
    await first.start();
    await first.next(); // on 'gone'
    first.pause();

    const resumed = createController(VIEWER, [step('a', 10), step('b', 20)]);
    await resumed.start();
    expect(resumed.currentIndex).toBe(0);
    expect(resumed.steps[resumed.currentIndex].id).toBe('a');
  });

  it('restarts a completed tour from the top', async () => {
    const steps = [step('a', 10), step('b', 20)];
    const first = createController(VIEWER, steps);
    await first.start();
    await first.next(); // on 'b'
    await first.next(); // past the end -> complete
    expect(first.active).toBe(false);

    const restart = createController(VIEWER, steps);
    await restart.start();
    expect(restart.currentIndex).toBe(0);
  });
});
