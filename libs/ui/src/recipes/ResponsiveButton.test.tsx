/** ResponsiveButton and ActionToolbar: labelled controls on a wide screen, compact controls on a phone. */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { ActionToolbar } from './ActionToolbar';
import { ResponsiveButton } from './ResponsiveButton';

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

function renderUi(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('ResponsiveButton', () => {
  afterEach(() => setMobile(false));

  it('shows the label on a wide screen', () => {
    setMobile(false);
    const onClick = vi.fn();
    renderUi(<ResponsiveButton label="Seguinte" icon={<span>&gt;</span>} onClick={onClick} />);
    expect(screen.getByText('Seguinte')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Seguinte/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows only the icon on a phone and keeps the name', () => {
    setMobile(true);
    const onClick = vi.fn();
    renderUi(<ResponsiveButton label="Seguinte" icon={<span>&gt;</span>} onClick={onClick} />);
    expect(screen.queryByText('Seguinte')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ActionToolbar', () => {
  afterEach(() => setMobile(false));

  const actions = (onTables: () => void, onPdf: () => void) => [
    { key: 'tables', label: 'Tabelas', onClick: onTables },
    { key: 'export', label: 'Exportar', items: [{ key: 'pdf', label: 'PDF', onClick: onPdf }] },
  ];

  it('shows each action as a button on a wide screen', () => {
    setMobile(false);
    const onTables = vi.fn();
    renderUi(<ActionToolbar start={<span>Início</span>} actions={actions(onTables, vi.fn())} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tabelas' }));
    expect(onTables).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });

  it('folds the actions into one menu on a phone', async () => {
    setMobile(true);
    const onPdf = vi.fn();
    renderUi(<ActionToolbar start={<span>Início</span>} actions={actions(vi.fn(), onPdf)} />);
    expect(screen.getByText('Início')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tabelas' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(await screen.findByText('Exportar')).toBeTruthy();
    const pdf = (await screen.findByText('PDF')).closest('button') as HTMLElement;
    expect(pdf.getAttribute('role')).toBe('menuitem');
    fireEvent.click(pdf);
    expect(onPdf).toHaveBeenCalledTimes(1);
  });
});
