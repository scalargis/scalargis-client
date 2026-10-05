import type { OnboardingStep } from '@scalargis/ui';
import { describe, expect, it } from 'vitest';

import { applyTourSections, tourSections } from './sections';

const step = (id: string, order: number): OnboardingStep => ({ id, order, target: id, title: id, content: id });

const base = [step('toc', 20), step('print', 120)];
const self = {
  CatalogoSNIG: [step('snig:a', 200), step('snig:b', 240)],
  MapasPT: [step('mapaspt:intro', 310), step('mapaspt:draw', 320)],
};

const ids = (steps: OnboardingStep[]) =>
  [...steps].sort((a, b) => (a.order ?? 100) - (b.order ?? 100)).map((s) => s.id);

describe('tourSections', () => {
  it('returns null without a sections list', () => {
    expect(tourSections(null)).toBeNull();
    expect(tourSections({})).toBeNull();
    expect(tourSections({ onboarding: { enabled: true } })).toBeNull();
  });

  it('keeps only the string names', () => {
    expect(tourSections({ onboarding: { sections: ['MapasPT', 3, '', 'core'] } })).toEqual(['MapasPT', 'core']);
  });
});

describe('applyTourSections', () => {
  it('runs the components before core', () => {
    const out = applyTourSections(base, self, ['CatalogoSNIG', 'MapasPT', 'core']);
    expect(ids(out)).toEqual(['snig:a', 'snig:b', 'mapaspt:intro', 'mapaspt:draw', 'toc', 'print']);
  });

  it('drops the sections that the list does not name', () => {
    const out = applyTourSections(base, self, ['CatalogoSNIG', 'MapasPT']);
    expect(ids(out)).toEqual(['snig:a', 'snig:b', 'mapaspt:intro', 'mapaspt:draw']);
  });

  it('skips an unknown or repeated name', () => {
    const out = applyTourSections(base, self, ['Nope', 'core', 'core']);
    expect(ids(out)).toEqual(['toc', 'print']);
  });

  it('does not change the input steps', () => {
    applyTourSections(base, self, ['MapasPT', 'core']);
    expect(base[0].order).toBe(20);
    expect(self.MapasPT[0].order).toBe(310);
  });
});
