import type { OnboardingStep } from '@scalargis/ui';
import { describe, expect, it } from 'vitest';

import { applyTourSections, tourSections } from './sections';

const step = (id: string, order: number): OnboardingStep => ({ id, order, target: id, title: id, content: id });

const base = [step('toc', 20), step('print', 120)];
const self = {
  CatalogoSNIG: [step('snig:a', 200), step('snig:b', 240)],
  MapasPT: [step('mapaspt:intro', 310), step('mapaspt:draw', 320)],
};

const flowStep = (id: string, order: number, flow: OnboardingStep['flow']): OnboardingStep => ({ ...step(id, order), flow });

const scopedSelf = {
  CatalogoSNIG: [flowStep('snig:a', 200, ['catalogosnig', 'viewer'])],
  MapasPT: [flowStep('mapaspt:intro', 310, ['mapaspt', 'viewer']), flowStep('mapaspt:only', 320, 'mapaspt')],
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

  it('keeps the scoped flows of a section that the list does not name', () => {
    const out = applyTourSections(base, scopedSelf, ['core']);
    const byId = Object.fromEntries(out.map((s) => [s.id, s]));
    expect(ids(out)).toEqual(['snig:a', 'mapaspt:intro', 'mapaspt:only', 'toc', 'print']);
    expect(byId['snig:a'].flow).toBe('catalogosnig');
    expect(byId['mapaspt:intro'].flow).toBe('mapaspt');
    expect(byId['mapaspt:intro'].order).toBe(310);
    expect(byId['mapaspt:only'].flow).toBe('mapaspt');
    expect(byId['toc'].order).toBe(1020);
  });

  it('keeps both flows of a section that the list names', () => {
    const out = applyTourSections(base, scopedSelf, ['core', 'MapasPT']);
    const byId = Object.fromEntries(out.map((s) => [s.id, s]));
    expect(byId['mapaspt:intro'].flow).toEqual(['mapaspt', 'viewer']);
    expect(byId['mapaspt:intro'].order).toBe(2310);
    expect(byId['snig:a'].flow).toBe('catalogosnig');
  });

  it('drops a step whose only flow is viewer when its section is not named', () => {
    const out = applyTourSections(base, scopedSelf, ['MapasPT']);
    expect(out.map((s) => s.id)).not.toContain('toc');
    expect(out.map((s) => s.id)).toContain('snig:a');
  });
});
