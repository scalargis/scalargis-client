/**
 * Dialog recipe contract: Prime-Dialog parity pieces on the Modal.Root
 * composition — the maximize/restore header toggle, the footer bar pinned
 * outside the scrolling body, and the flex column that makes 100%-height
 * children (iframes) track the dialog size.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { Dialog } from './Dialog';

function renderDialog(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
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
});
