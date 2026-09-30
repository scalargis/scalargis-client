import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useTopbarOffset } from './useTopbarOffset';

describe('useTopbarOffset', () => {
  afterEach(() => {
    document.querySelectorAll('.layout-embedded').forEach((el) => el.remove());
  });

  it('returns the fallback in the normal layout', () => {
    const { result } = renderHook(() => useTopbarOffset(50));
    expect(result.current).toBe(50);
  });

  it('returns 0 in the embedded layout', () => {
    const layout = document.createElement('div');
    layout.className = 'layout-embedded';
    document.body.appendChild(layout);
    const { result } = renderHook(() => useTopbarOffset(50));
    expect(result.current).toBe(0);
  });
});
