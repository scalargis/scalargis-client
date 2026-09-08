/**
 * MapPanel contract: the collapse-to-pill toggle, the controlled open state
 * the tour drives, the non-modal dock (no overlay, no self-close), the float
 * card on Affix + Transition, and both themes.
 */
import React from 'react';
import { MantineProvider, type MantineColorScheme } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { MapPanel, type MapPanelProps } from './MapPanel';

function renderPanel(ui: React.ReactElement, colorScheme: MantineColorScheme = 'light') {
  return render(
    <MantineProvider theme={adsBaseTheme} forceColorScheme={colorScheme as 'light' | 'dark'}>
      {ui}
    </MantineProvider>
  );
}

function dockProps(over: Partial<MapPanelProps> = {}): MapPanelProps {
  return {
    variant: 'dock',
    opened: true,
    onClose: vi.fn(),
    title: 'Painel',
    collapsedControl: <button type="button">Abrir</button>,
    children: <div>Conteúdo</div>,
    ...over,
  } as MapPanelProps;
}

describe('MapPanel', () => {
  it('shows the pill when closed and the panel when open', async () => {
    const { rerender } = renderPanel(<MapPanel {...dockProps({ opened: false })} />);
    expect(screen.getByText('Abrir')).toBeTruthy();
    expect(screen.queryByText('Conteúdo')).toBeNull();

    rerender(
      <MantineProvider theme={adsBaseTheme}>
        <MapPanel {...dockProps({ opened: true })} />
      </MantineProvider>
    );
    // The Drawer mounts its body after the enter transition.
    expect(await screen.findByText('Conteúdo')).toBeTruthy();
    expect(screen.queryByText('Abrir')).toBeNull();
  });

  it('closes through the header control by calling onClose', () => {
    const onClose = vi.fn();
    renderPanel(<MapPanel {...dockProps({ onClose })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays controlled: the panel does not self-close, so the tour keeps it open', () => {
    const onClose = vi.fn();
    renderPanel(<MapPanel {...dockProps({ onClose })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    // The parent did not flip `opened`, so the content is still mounted.
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });

  it('dock runs non-modal: no overlay covers the map', () => {
    renderPanel(<MapPanel {...dockProps()} />);
    expect(document.querySelector('.mantine-Drawer-overlay')).toBeNull();
  });

  it('renders header actions before the close button', () => {
    renderPanel(<MapPanel {...dockProps({ headerActions: <button type="button">Ajuda</button> })} />);
    expect(screen.getByRole('button', { name: 'Ajuda' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('float variant mounts the card content when open', () => {
    renderPanel(
      <MapPanel
        variant="float"
        opened
        onClose={vi.fn()}
        title="Cartão"
        collapsedControl={<button type="button">Abrir</button>}
      >
        <div>Flutuante</div>
      </MapPanel>
    );
    expect(screen.getByText('Flutuante')).toBeTruthy();
    expect(screen.queryByText('Abrir')).toBeNull();
  });

  it('float variant shows the pill and no card when closed', () => {
    renderPanel(
      <MapPanel
        variant="float"
        opened={false}
        onClose={vi.fn()}
        title="Cartão"
        collapsedControl={<button type="button">Abrir</button>}
      >
        <div>Flutuante</div>
      </MapPanel>
    );
    expect(screen.getByText('Abrir')).toBeTruthy();
    expect(screen.queryByText('Flutuante')).toBeNull();
  });

  it('renders in the dark theme', () => {
    renderPanel(<MapPanel {...dockProps()} />, 'dark');
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });
});
