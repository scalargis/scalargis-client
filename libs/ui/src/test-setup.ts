/* Mantine reads matchMedia and ResizeObserver on mount; jsdom ships neither. */
import { vi } from 'vitest';

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

/* eslint-disable @typescript-eslint/no-empty-function -- intentional no-op stubs */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
