import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useFooterHeight } from './useFooterHeight';

describe('useFooterHeight', () => {
  afterEach(() => {
    document.querySelectorAll('.layout-footer').forEach((el) => el.remove());
  });

  it('returns the fallback while no footer is mounted', () => {
    const { result } = renderHook(() => useFooterHeight(42));
    expect(result.current).toBe(42);
  });

  it('reads the height of the viewer footer', async () => {
    const footer = document.createElement('div');
    footer.className = 'layout-footer';
    Object.defineProperty(footer, 'offsetHeight', { configurable: true, value: 35 });
    document.body.appendChild(footer);
    const { result } = renderHook(() => useFooterHeight());
    await waitFor(() => expect(result.current).toBe(35));
  });
});
