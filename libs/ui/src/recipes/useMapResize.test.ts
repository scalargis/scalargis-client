/**
 * useMapResize seam: opening adds the class, closing removes it, and unmount
 * returns #map to full width. The consumer's dispatch and actions are called;
 * the hook holds no Redux of its own.
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMapResize, type MapResizeDeps } from './useMapResize';

function makeDeps(): MapResizeDeps {
  return {
    dispatch: vi.fn(),
    actions: {
      map_add_class: vi.fn((c: string) => ({ type: 'MAP_ADD_CLASS', className: c })),
      map_remove_class: vi.fn((c: string) => ({ type: 'MAP_REMOVE_CLASS', className: c })),
    },
  };
}

describe('useMapResize', () => {
  it('adds the class while open', () => {
    const deps = makeDeps();
    renderHook(() => useMapResize(true, 'mapaspt-control-content-opened', deps));
    expect(deps.actions.map_add_class).toHaveBeenCalledWith('mapaspt-control-content-opened');
    expect(deps.dispatch).toHaveBeenCalledWith({
      type: 'MAP_ADD_CLASS',
      className: 'mapaspt-control-content-opened',
    });
  });

  it('removes the class while closed', () => {
    const deps = makeDeps();
    renderHook(() => useMapResize(false, 'coscid-control-content-opened', deps));
    expect(deps.actions.map_remove_class).toHaveBeenCalledWith('coscid-control-content-opened');
    expect(deps.actions.map_add_class).not.toHaveBeenCalled();
  });

  it('removes the class on unmount', () => {
    const deps = makeDeps();
    const { unmount } = renderHook(() => useMapResize(true, 'x-opened', deps));
    (deps.actions.map_remove_class as ReturnType<typeof vi.fn>).mockClear();
    unmount();
    expect(deps.actions.map_remove_class).toHaveBeenCalledWith('x-opened');
  });
});
