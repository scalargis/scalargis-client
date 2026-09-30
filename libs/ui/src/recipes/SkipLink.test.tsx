/**
 * SkipLink contract: a link that is first in the DOM,
 * points at the shell's content landmark, and on activation moves focus
 * onto that landmark without leaving it in the tab order.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('renders an anchor at the default target with the built-in label', () => {
    render(<SkipLink />);

    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link.getAttribute('href')).toBe('#main-content');
    expect(link.className).toBe('ads-skip-link');
  });

  it('moves focus onto the landmark and drops the transient tabindex on blur', () => {
    render(
      <div>
        <SkipLink />
        <main id="main-content">content</main>
      </div>
    );
    const main = document.getElementById('main-content') as HTMLElement;

    fireEvent.click(screen.getByRole('link'));
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');

    // Once focus leaves, the landmark must not stay in the tab order.
    main.blur();
    expect(main.hasAttribute('tabindex')).toBe(false);
  });

  it('respects a custom target id and label', () => {
    render(
      <div>
        <SkipLink targetId="conteudo" label="Saltar" />
        <div id="conteudo" />
      </div>
    );

    const link = screen.getByRole('link', { name: 'Saltar' });
    expect(link.getAttribute('href')).toBe('#conteudo');

    fireEvent.click(link);
    expect(document.activeElement).toBe(document.getElementById('conteudo'));
  });

  it('keeps a target-supplied tabindex instead of removing it on blur', () => {
    render(
      <div>
        <SkipLink />
        <main id="main-content" tabIndex={-1}>
          content
        </main>
      </div>
    );
    const main = document.getElementById('main-content') as HTMLElement;

    fireEvent.click(screen.getByRole('link'));
    expect(document.activeElement).toBe(main);

    main.blur();
    expect(main.getAttribute('tabindex')).toBe('-1');
  });
});
