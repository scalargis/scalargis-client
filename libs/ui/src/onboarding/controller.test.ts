import { beforeEach, describe, expect, it } from 'vitest';

import { createController } from './controller';
import type { OnboardingStep } from './types';

/* Steps carry only id and order here; the controller does not read text. */
function step(id: string, order: number): OnboardingStep {
  return { id, order };
}

/* A step in a named flow, for the flow-scoped run tests. */
function flowStep(id: string, order: number, flow: string): OnboardingStep {
  return { id, order, flow };
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

describe('onboarding controller — live step swap (F4)', () => {
  it('swaps the list in silence while idle', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20)]);
    // Not started yet. A membership change replaces the list.
    await ctrl.setSteps([step('a', 10), step('c', 30), step('d', 40)]);
    expect(ctrl.active).toBe(false);
    expect(ctrl.currentIndex).toBe(-1);
    expect(ctrl.steps.map((s) => s.id)).toEqual(['a', 'c', 'd']);
    // A later start uses the swapped list.
    await ctrl.start();
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('a');
  });

  it('keeps the active step by id when a step is inserted before it', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30)]);
    await ctrl.start();
    await ctrl.next(); // on 'b', index 1
    expect(ctrl.currentIndex).toBe(1);

    // A login inserts 'x' (order 15) before 'b'. 'b' shifts to index 2.
    await ctrl.setSteps([step('a', 10), step('x', 15), step('b', 20), step('c', 30)]);
    expect(ctrl.active).toBe(true);
    expect(ctrl.currentIndex).toBe(2);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('b');
  });

  it('keeps the active step and index when a step is added after it', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30)]);
    await ctrl.start();
    await ctrl.next(); // on 'b', index 1
    // A step 'z' (order 25) joins after 'b'. Index stays 1, the list grows.
    await ctrl.setSteps([step('a', 10), step('b', 20), step('z', 25), step('c', 30)]);
    expect(ctrl.active).toBe(true);
    expect(ctrl.currentIndex).toBe(1);
    expect(ctrl.steps).toHaveLength(4);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('b');
  });

  it('resumes on the same id after a silent remap in a new session', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30)]);
    await ctrl.start();
    await ctrl.next(); // on 'b'
    await ctrl.setSteps([step('a', 10), step('x', 15), step('b', 20), step('c', 30)]);
    ctrl.pause();

    const resumed = createController(VIEWER, [step('a', 10), step('x', 15), step('b', 20)]);
    await resumed.start();
    expect(resumed.steps[resumed.currentIndex].id).toBe('b');
  });

  it('moves forward to the nearest survivor when the active step is dropped', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30), step('d', 40)]);
    await ctrl.start();
    await ctrl.next();
    await ctrl.next(); // on 'c', index 2, lastDir forward
    await ctrl.setSteps([step('a', 10), step('b', 20), step('d', 40)]); // 'c' gone
    expect(ctrl.active).toBe(true);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('d');
  });

  it('moves back to the nearest survivor when the active step is dropped going back', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30), step('d', 40)]);
    await ctrl.start();
    await ctrl.next();
    await ctrl.next(); // on 'c'
    await ctrl.prev(); // back to 'b', index 1, lastDir backward
    await ctrl.setSteps([step('a', 10), step('c', 30), step('d', 40)]); // 'b' gone
    expect(ctrl.active).toBe(true);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('a');
  });

  it('flips forward when the dropped step was going back and nothing survives behind', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30), step('d', 40)]);
    await ctrl.start();
    await ctrl.next();
    await ctrl.next(); // on 'c'
    await ctrl.prev(); // back to 'b', lastDir backward
    // 'a' and 'b' both leave. Nothing survives behind 'b', so land forward on 'c'.
    await ctrl.setSteps([step('c', 30), step('d', 40)]);
    expect(ctrl.active).toBe(true);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('c');
  });

  it('completes when the active step and every step after it are dropped', async () => {
    const ctrl = createController(VIEWER, [step('a', 10), step('b', 20), step('c', 30), step('d', 40)]);
    await ctrl.start();
    await ctrl.next();
    await ctrl.next(); // on 'c', lastDir forward
    await ctrl.setSteps([step('a', 10), step('b', 20)]); // 'c' and 'd' gone
    expect(ctrl.active).toBe(false);
  });
});

describe('onboarding controller — flow-scoped run (P1)', () => {
  // A list that mixes two flows. A scoped run walks only its own flow.
  const mixed = [
    flowStep('a1', 10, 'a'),
    flowStep('b1', 20, 'b'),
    flowStep('a2', 30, 'a'),
    flowStep('b2', 40, 'b'),
  ];

  it('walks only the steps of the requested flow', async () => {
    const ctrl = createController(VIEWER, mixed);
    await ctrl.start({ flow: 'a' });
    expect(ctrl.activeFlow).toBe('a');
    expect(ctrl.steps.map((s) => s.id)).toEqual(['a1', 'a2']);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('a1');
    await ctrl.next();
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('a2');
    await ctrl.next(); // past the flow-a end -> complete
    expect(ctrl.active).toBe(false);
  });

  it('counts the scoped total, not the merged total', async () => {
    const ctrl = createController(VIEWER, mixed);
    await ctrl.start({ flow: 'a' });
    // The overlay counter reads ctrl.steps.length. It must be the flow-a count.
    expect(ctrl.steps).toHaveLength(2);
  });

  it('saves progress under a flow-keyed slot, apart from the unscoped slot', async () => {
    const ctrl = createController(VIEWER, mixed);
    await ctrl.start({ flow: 'a' });
    await ctrl.next(); // on 'a2'
    ctrl.pause();
    expect(localStorage.getItem(`sg:ob:viewer:${VIEWER}:a`)).not.toBeNull();
    expect(localStorage.getItem(`sg:ob:viewer:${VIEWER}`)).toBeNull();

    // Resume with the same flow lands on the saved flow-a step.
    const resumed = createController(VIEWER, mixed);
    await resumed.start({ flow: 'a' });
    expect(resumed.steps[resumed.currentIndex].id).toBe('a2');
  });

  it('keeps a scoped run and an unscoped run in separate slots', async () => {
    // The unscoped run walks the whole list and saves under the plain key.
    const scoped = createController(VIEWER, mixed);
    await scoped.start({ flow: 'a' });
    await scoped.next(); // flow-a run on 'a2'
    scoped.pause();

    const unscoped = createController(VIEWER, mixed);
    await unscoped.start();
    expect(unscoped.activeFlow).toBeNull();
    expect(unscoped.steps).toHaveLength(4);
    // The unscoped run starts fresh; the scoped run's saved step does not leak.
    expect(unscoped.steps[unscoped.currentIndex].id).toBe('a1');
    unscoped.pause();

    // The flow-a slot still resumes on 'a2', untouched by the unscoped run.
    const back = createController(VIEWER, mixed);
    await back.start({ flow: 'a' });
    expect(back.steps[back.currentIndex].id).toBe('a2');
  });

  it('keeps the flow scope across a live step swap', async () => {
    const ctrl = createController(VIEWER, mixed);
    await ctrl.start({ flow: 'a' }); // on 'a1'
    // A membership change adds another flow-a step and another flow-b step.
    await ctrl.setSteps([
      ...mixed,
      flowStep('a3', 50, 'a'),
      flowStep('b3', 60, 'b'),
    ]);
    expect(ctrl.active).toBe(true);
    expect(ctrl.steps.map((s) => s.id)).toEqual(['a1', 'a2', 'a3']);
    expect(ctrl.steps[ctrl.currentIndex].id).toBe('a1');
  });
});
