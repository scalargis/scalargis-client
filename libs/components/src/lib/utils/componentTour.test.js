import { describe, expect, it } from 'vitest';

import { componentTourListed } from './componentTour';

describe('componentTourListed', () => {
  it('needs the tour flag', () => {
    expect(componentTourListed({ onboarding: { component_tours: ['MapasPT'] } }, 'MapasPT')).toBe(false);
    expect(componentTourListed({ onboarding: { enabled: false, component_tours: ['MapasPT'] } }, 'MapasPT')).toBe(false);
  });

  it('needs the type in component_tours', () => {
    const cfg = { onboarding: { enabled: true, component_tours: ['MapasPT'] } };
    expect(componentTourListed(cfg, 'MapasPT')).toBe(true);
    expect(componentTourListed(cfg, 'CatalogoSNIG')).toBe(false);
    expect(componentTourListed(cfg, undefined)).toBe(false);
  });

  it('is false without a list or a config', () => {
    expect(componentTourListed({ onboarding: { enabled: true } }, 'MapasPT')).toBe(false);
    expect(componentTourListed({ onboarding: { enabled: true, component_tours: 'MapasPT' } }, 'MapasPT')).toBe(false);
    expect(componentTourListed(null, 'MapasPT')).toBe(false);
  });
});
