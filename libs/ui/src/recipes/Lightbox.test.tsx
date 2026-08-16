/**
 * Lightbox preset: a single image in a Dialog — withOverlay, no footer,
 * image fit-to-viewport, Esc/backdrop close inherited from Dialog. It is a
 * composition over Dialog, so P0b's single-image modals drop their raw <Modal>.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { Lightbox } from './Lightbox';

function renderLightbox(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('Lightbox', () => {
  it('renders the image with its alt text', () => {
    renderLightbox(
      <Lightbox opened onClose={() => {}} src="/photo.jpg" alt="Uma foto" />
    );
    const img = screen.getByRole('img', { name: 'Uma foto' }) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/photo.jpg');
  });

  it('has no footer bar and closes via the header control', () => {
    const onClose = vi.fn();
    renderLightbox(
      <Lightbox opened onClose={onClose} src="/photo.jpg" alt="Uma foto" />
    );
    expect(document.querySelector('.ads-dialog__footer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
