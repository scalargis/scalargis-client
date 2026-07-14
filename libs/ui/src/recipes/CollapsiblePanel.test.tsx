/**
 * CollapsiblePanel disclosure contract: a real header button carrying
 * aria-expanded/aria-controls (the reason this is not a one-item Accordion),
 * plus the controlled/uncontrolled split.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { CollapsiblePanel } from './CollapsiblePanel';

function renderPanel(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('CollapsiblePanel', () => {
  it('announces the disclosure relationship on a real button', () => {
    renderPanel(<CollapsiblePanel header="Filters">Body</CollapsiblePanel>);

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const controlled = document.getElementById(button.getAttribute('aria-controls') as string);
    expect(controlled?.textContent).toContain('Body');
  });

  it('toggles uncontrolled state on click, honouring defaultOpened', () => {
    renderPanel(
      <CollapsiblePanel header="Filters" defaultOpened={false}>
        Body
      </CollapsiblePanel>
    );

    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('in controlled mode reports the intent but never moves on its own', () => {
    const onChange = vi.fn();
    renderPanel(
      <CollapsiblePanel header="Filters" opened={false} onChange={onChange}>
        Body
      </CollapsiblePanel>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(true);
    // The parent did not update `opened`, so the panel must not flip.
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });

  it('renders a plain titled surface when not toggleable', () => {
    renderPanel(
      <CollapsiblePanel header="Static" toggleable={false}>
        Body
      </CollapsiblePanel>
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Static')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });
});
