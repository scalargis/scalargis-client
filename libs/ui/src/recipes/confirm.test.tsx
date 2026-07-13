import React from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { confirm } from './confirm';

/**
 * Minimal harness: the theme object (so `danger` resolves to an ADS palette
 * rather than being passed through as a raw CSS colour) but not AdsProviders,
 * which would pull in webfonts and stylesheets for no benefit here.
 */
function renderHarness() {
  return render(
    <MantineProvider theme={adsBaseTheme}>
      <ModalsProvider />
    </MantineProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('confirm', () => {
  it('renders the message and both labels', async () => {
    renderHarness();
    act(() => {
      confirm({ message: 'Delete this record?', acceptLabel: 'Yes', rejectLabel: 'No' });
    });

    expect(await screen.findByText('Delete this record?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No' })).toBeTruthy();
  });

  it('calls accept (not reject) when the accept button is pressed', async () => {
    const accept = vi.fn();
    const reject = vi.fn();
    renderHarness();
    act(() => {
      confirm({ message: 'Proceed?', acceptLabel: 'OK', accept, reject });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'OK' }));

    expect(accept).toHaveBeenCalledOnce();
    expect(reject).not.toHaveBeenCalled();
  });

  it('calls reject (not accept) when the reject button is pressed', async () => {
    const accept = vi.fn();
    const reject = vi.fn();
    renderHarness();
    act(() => {
      confirm({ message: 'Proceed?', rejectLabel: 'Cancel', accept, reject });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(reject).toHaveBeenCalledOnce();
    expect(accept).not.toHaveBeenCalled();
  });

  /**
   * The distinction PrimeReact draws and 34 call sites rely on: an Esc dismiss
   * is not a rejection. reject() typically raises a "cancelled" toast, which
   * must not fire because someone tapped Esc.
   */
  it('does not call reject when dismissed with Escape, but does call onHide', async () => {
    const accept = vi.fn();
    const reject = vi.fn();
    const onHide = vi.fn();
    renderHarness();
    act(() => {
      confirm({ message: 'Proceed?', accept, reject, onHide });
    });

    await screen.findByText('Proceed?');
    fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(onHide).toHaveBeenCalledOnce());
    expect(reject).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
  });

  it('calls onHide on every close path, including accept', async () => {
    const onHide = vi.fn();
    renderHarness();
    act(() => {
      confirm({ message: 'Proceed?', acceptLabel: 'OK', onHide });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'OK' }));

    await waitFor(() => expect(onHide).toHaveBeenCalledOnce());
  });

  it('fills the accept button from the severity palette', async () => {
    renderHarness();
    act(() => {
      confirm({ message: 'Delete?', severity: 'danger', acceptLabel: 'Delete' });
    });

    const accept = await screen.findByRole('button', { name: 'Delete' });
    // Mantine resolves color="danger" to its palette CSS var, proving the
    // severity reached the button rather than being passed through as a
    // literal CSS colour named "danger".
    expect(accept.style.getPropertyValue('--button-bg')).toBe(
      'var(--mantine-color-danger-filled)'
    );
  });

  it('defaults severity to primary', async () => {
    renderHarness();
    act(() => {
      confirm({ message: 'Proceed?', acceptLabel: 'OK' });
    });

    const accept = await screen.findByRole('button', { name: 'OK' });
    expect(accept.style.getPropertyValue('--button-bg')).toBe(
      'var(--mantine-color-primary-filled)'
    );
  });
});
