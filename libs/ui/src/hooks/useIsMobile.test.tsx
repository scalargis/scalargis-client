/**
 * useIsMobile contract: the shared home for the 768 breakpoint. It must be
 * reactive (re-render on resize) and default the magic number to 768 — the
 * two things the old non-reactive getWindowSize() snapshot got wrong.
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from './useIsMobile';

/* A controllable matchMedia: it remembers the query's listeners so a test can
   flip `matches` and fire a change, standing in for a resize crossing the bp.
   test-setup.ts installs a static matches:false stub globally; this replaces
   it for the duration of each test that needs to move the boundary. */
function installMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: '',
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: (cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeListener: (cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    dispatchEvent: () => true,
  };
  const set = (next: boolean) => {
    mql.matches = next;
    listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
  };
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({ ...mql, media: query }));
  return { set };
}

function Probe({ bp }: { bp?: number }) {
  const isMobile = useIsMobile(bp);
  return <span data-testid="probe">{isMobile ? 'mobile' : 'desktop'}</span>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useIsMobile', () => {
  it('is true at or below the breakpoint, false above', () => {
    installMatchMedia(true);
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toBe('mobile');
  });

  it('reports desktop when the query does not match', () => {
    installMatchMedia(false);
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toBe('desktop');
  });

  it('re-renders when the viewport crosses the boundary', () => {
    const media = installMatchMedia(false);
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toBe('desktop');

    act(() => media.set(true));
    expect(screen.getByTestId('probe').textContent).toBe('mobile');
  });

  it('defaults the breakpoint to 768', () => {
    const spy = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = spy;
    render(<Probe />);
    expect(spy).toHaveBeenCalledWith('(max-width: 768px)');
  });

  it('honours a caller-supplied breakpoint', () => {
    const spy = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = spy;
    render(<Probe bp={480} />);
    expect(spy).toHaveBeenCalledWith('(max-width: 480px)');
  });
});
