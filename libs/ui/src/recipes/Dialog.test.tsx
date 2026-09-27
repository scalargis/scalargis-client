/**
 * Dialog recipe contract: Prime-Dialog parity pieces on the Modal.Root
 * composition — the maximize/restore header toggle, the footer bar pinned
 * outside the scrolling body, and the flex column that makes 100%-height
 * children (iframes) track the dialog size.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { motionTransitionProps } from '../theme/motion';
import { Dialog } from './Dialog';
import { DIALOG_DEFAULTS } from './dialogDefaults';

function renderDialog(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

/** The --modal-size CSS variable Mantine's Modal writes from its `size` prop. */
function modalSize(): string {
  const el = document.querySelector('[style*="--modal-size"]') as HTMLElement | null;
  return el?.style.getPropertyValue('--modal-size').trim() ?? '';
}

/** Force the (max-width) media query to a given result for one test. */
function setMobile(isMobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('Dialog', () => {
  it('renders title, body and footer; footer sits outside the scroll body', () => {
    renderDialog(
      <Dialog opened onClose={() => {}} title="Ajuda" footer={<button>Fechar</button>}>
        Corpo
      </Dialog>
    );

    expect(screen.getByText('Ajuda')).toBeTruthy();
    const footer = screen.getByText('Fechar').closest('.ads-dialog__footer');
    expect(footer).toBeTruthy();
    // The scrollable body must not contain the footer.
    expect(screen.getByText('Corpo').closest('.ads-dialog__footer')).toBeNull();
  });

  it('maximize control toggles full screen and swaps its accessible name', () => {
    renderDialog(
      <Dialog opened onClose={() => {}} title="Ajuda" maximizable>
        Corpo
      </Dialog>
    );

    const toggle = screen.getByRole('button', { name: 'Maximize' });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Restore' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeTruthy();
  });

  /* Mantine's ModalContent copies `style`/`className` onto the inner wrapper as
     well as the content. The inner is the flex ROW that centres the dialog, so
     a `flexDirection: column` there flips `flex: 0 0 var(--modal-size)` from a
     width basis to a height one: narrow dialog, maximize that only grows
     downward, zero-height body (blank StreetView pano). The column must stay on
     the content slot alone. */
  it('does not leak the content column onto the inner wrapper', () => {
    renderDialog(
      <Dialog opened onClose={() => {}} title="Ajuda" size="50vw" height="80vh">
        Corpo
      </Dialog>
    );

    // The Modal is portaled, so it is not under the render container.
    const content = document.querySelector('.mantine-Modal-content');
    const inner = document.querySelector('.mantine-Modal-inner');

    expect(content?.classList.contains('ads-dialog__content')).toBe(true);
    expect(inner?.classList.contains('ads-dialog__content')).toBe(false);
    expect((inner as HTMLElement).style.flexDirection).toBe('');
  });

  it('has no maximize control unless asked, and close calls onClose', () => {
    const onClose = vi.fn();
    renderDialog(
      <Dialog opened onClose={onClose} title="Ajuda">
        Corpo
      </Dialog>
    );

    expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['top-left', 'flex-start'],
    ['top-right', 'flex-end'],
  ] as const)('anchors the %s position to that viewport corner', (position, justify) => {
    renderDialog(
      <Dialog opened onClose={vi.fn()} title="Ajuda" position={position}>
        Corpo
      </Dialog>
    );

    const inner = document.querySelector('.mantine-Modal-inner') as HTMLElement;
    expect(inner.style.justifyContent).toBe(justify);
    expect(inner.style.alignItems).toBe('flex-start');
  });

  it('leaves the inner wrapper to Mantine centring by default', () => {
    renderDialog(
      <Dialog opened onClose={vi.fn()} title="Ajuda">
        Corpo
      </Dialog>
    );

    const inner = document.querySelector('.mantine-Modal-inner') as HTMLElement;
    expect(inner.style.justifyContent).toBe('');
  });
});

/* DIALOG_DEFAULTS is the ONE source for the ADS dialog rung — AdsProviders'
   ModalsProvider and this recipe both spread it, so the z-index / centring /
   motion can't drift (R4). These lock its shape so a future edit can't
   re-fork the two consumers. */
describe('DIALOG_DEFAULTS', () => {
  it('carries the ADS rung: centred, z-6000, the dialog motion', () => {
    expect(DIALOG_DEFAULTS.centered).toBe(true);
    expect(DIALOG_DEFAULTS.zIndex).toBe(6000);
    // The motion is the SAME object the central tokens expose, not a copy.
    expect(DIALOG_DEFAULTS.transitionProps).toBe(motionTransitionProps.dialog);
  });

  it('agrees with the theme overlay ladder the Dialog falls back to', () => {
    const zLadder = (adsBaseTheme.other as Record<string, Record<string, number>>)
      .zLadder;
    expect(DIALOG_DEFAULTS.zIndex).toBe(zLadder.dialog);
  });
});

/* Responsive `size` default (P0a): caller `size` wins; with none, 90% below
   the md breakpoint and the desktop default above — so P0b call sites can
   drop their `size={isMobile ? '90%' : 'Nvw'}` ternary. */
describe('Dialog responsive size default', () => {
  afterEach(() => {
    setMobile(false); // restore the test-setup default (desktop)
  });

  it('uses the desktop default when no size is passed on a wide screen', () => {
    setMobile(false);
    renderDialog(
      <Dialog opened onClose={() => {}} title="Ajuda">
        Corpo
      </Dialog>
    );
    expect(modalSize()).toBe('35vw');
  });

  it('collapses to 90% below the breakpoint', () => {
    setMobile(true);
    renderDialog(
      <Dialog opened onClose={() => {}} title="Ajuda">
        Corpo
      </Dialog>
    );
    expect(modalSize()).toBe('90%');
  });

  it('lets a caller-passed size win on both breakpoints', () => {
    // On mobile the default would be 90%; a caller size overrides it. Use a
    // vw value (Mantine's rem() would rewrite a px string to rem — a wash for
    // this assertion) so the caller value passes through verbatim.
    setMobile(true);
    renderDialog(
      <Dialog opened onClose={() => {}} title="Ajuda" size="50vw">
        Corpo
      </Dialog>
    );
    expect(modalSize()).toBe('50vw');
  });
});
