/* Mantine reads matchMedia and ResizeObserver on mount; jsdom ships neither.
   Same stubs as libs/ui/src/test-setup.ts. */
import { vi } from 'vitest';
import { configure } from '@testing-library/react';

/* waitFor's default 1s cap flakes under machine load (observed: a run with
   ~3x slower test times failing 1 of 8). Polling is unchanged — a passing
   assertion still resolves immediately; only true failures wait longer. */
configure({ asyncUtilTimeout: 5000 });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverStub {
  observe() {
    /* noop */
  }
  unobserve() {
    /* noop */
  }
  disconnect() {
    /* noop */
  }
}

window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

/* Mantine's Textarea autosize listens on document.fonts; jsdom has none. */
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
});
