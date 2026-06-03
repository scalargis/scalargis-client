import {
  primereactRenderers,
  primereactCells,
  primereactLayouts,
  Unwrapped,
} from './jsonforms-primereact-renderers';

describe('PrimeReact JSON Forms renderers', () => {
  it('exports a non-empty renderer registry', () => {
    expect(Array.isArray(primereactRenderers)).toBe(true);
    expect(primereactRenderers.length).toBeGreaterThan(0);
  });

  it('each renderer entry has a tester and a renderer', () => {
    for (const entry of primereactRenderers) {
      expect(typeof entry.tester).toBe('function');
      expect(entry.renderer).toBeDefined();
    }
  });

  it('exports a cells registry (currently empty)', () => {
    expect(Array.isArray(primereactCells)).toBe(true);
  });

  it('exports layout components', () => {
    expect(primereactLayouts).toBeDefined();
    expect(primereactLayouts.PrimereactGroupLayout).toBeDefined();
    expect(primereactLayouts.PrimereactHorizontalLayout).toBeDefined();
    expect(primereactLayouts.PrimereactVerticalLayout).toBeDefined();
  });

  it('exports Unwrapped collection', () => {
    expect(Unwrapped).toBeDefined();
    expect(typeof Unwrapped).toBe('object');
  });
});
