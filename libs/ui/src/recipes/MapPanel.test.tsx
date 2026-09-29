/**
 * MapPanel contract: the collapse-to-pill toggle, the controlled open state
 * the tour drives, the non-modal dock (no overlay, no self-close), the float
 * card on Affix + Transition, and both themes.
 */
import React from 'react';
import { MantineProvider, type MantineColorScheme } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('float variant caps the card width at the viewport', () => {
    renderPanel(
      <MapPanel variant="float" opened onClose={vi.fn()} title="Cartão" size="30em">
        <div>Flutuante</div>
      </MapPanel>
    );
    const card = screen.getByText('Flutuante').closest('.mantine-Paper-root') as HTMLElement;
    expect(card.style.width).toBe('30em');
    expect(card.style.maxWidth).toBe('calc(100vw - 32px)');
  });

  it('float variant keeps the card body above the footer', () => {
    renderPanel(
      <MapPanel variant="float" opened onClose={vi.fn()} title="Cartão" offsetBottom={35}>
        <div>Flutuante</div>
      </MapPanel>
    );
    const body = screen.getByText('Flutuante').parentElement as HTMLElement;
    expect(body.style.maxHeight).toBe('calc(100dvh - 159px)');
    expect(body.style.display).toBe('flex');
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

  it('paints the header when headerColor is set', () => {
    renderPanel(<MapPanel {...dockProps({ headerColor: 'warning.5' })} />);
    const header = document.querySelector('.mantine-Drawer-header') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.getAttribute('style') || '').toContain('background');
  });

  it('renders in the dark theme', () => {
    renderPanel(<MapPanel {...dockProps()} />, 'dark');
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });
});

function setMobile(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matches && query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function floatProps(over: Partial<MapPanelProps> = {}): MapPanelProps {
  return {
    variant: 'float',
    opened: true,
    onClose: vi.fn(),
    title: 'Painel',
    collapsedControl: <button type="button">Abrir</button>,
    children: <div>Conteúdo</div>,
    ...over,
  } as MapPanelProps;
}

async function findSheet() {
  return (await screen.findByRole('region', { name: 'Painel' })) as HTMLElement;
}

function pointer(el: Element, type: 'pointerDown' | 'pointerMove' | 'pointerUp', clientY: number) {
  fireEvent[type](el, { clientY, pointerId: 1 });
}

describe('MapPanel on a phone', () => {
  const realMatchMedia = window.matchMedia;
  const realHeight = window.innerHeight;

  beforeEach(() => {
    setMobile(true);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: realHeight });
  });

  it('float renders a bottom sheet with the header slots', async () => {
    const onClose = vi.fn();
    renderPanel(<MapPanel {...floatProps({ onClose, headerActions: <button type="button">Ajuda</button> })} />);
    const sheet = await findSheet();
    expect(sheet.classList.contains('ads-mappanel-sheet')).toBe(true);
    expect(sheet.getAttribute('data-stop')).toBe('0');
    expect(screen.getByRole('button', { name: 'Ajuda' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a tap on the grip steps through the three stops', async () => {
    renderPanel(<MapPanel {...floatProps()} />);
    const sheet = await findSheet();
    const grip = screen.getByRole('button', { name: 'Resize panel' });
    fireEvent.click(grip);
    expect(sheet.getAttribute('data-stop')).toBe('1');
    fireEvent.click(grip);
    expect(sheet.getAttribute('data-stop')).toBe('2');
    fireEvent.click(grip);
    expect(sheet.getAttribute('data-stop')).toBe('0');
  });

  it('the arrow keys on the grip step one stop', async () => {
    renderPanel(<MapPanel {...floatProps()} />);
    const sheet = await findSheet();
    const grip = screen.getByRole('button', { name: 'Resize panel' });
    fireEvent.keyDown(grip, { key: 'ArrowUp' });
    fireEvent.keyDown(grip, { key: 'ArrowUp' });
    fireEvent.keyDown(grip, { key: 'ArrowUp' });
    expect(sheet.getAttribute('data-stop')).toBe('2');
    fireEvent.keyDown(grip, { key: 'ArrowDown' });
    expect(sheet.getAttribute('data-stop')).toBe('1');
  });

  it('a drag follows the pointer and snaps to the nearest stop', async () => {
    renderPanel(<MapPanel {...floatProps()} />);
    const sheet = await findSheet();
    const head = sheet.querySelector('.ads-mappanel-sheet-head') as HTMLElement;
    let h = 300;
    sheet.getBoundingClientRect = () => ({ height: h }) as DOMRect;
    pointer(head, 'pointerDown', 700);
    pointer(head, 'pointerMove', 450);
    expect(sheet.style.height).toBe('550px');
    h = 550;
    pointer(head, 'pointerUp', 450);
    expect(sheet.getAttribute('data-stop')).toBe('1');
  });

  it('a drag on a header button does not move the sheet', async () => {
    renderPanel(<MapPanel {...floatProps()} />);
    const sheet = await findSheet();
    const close = screen.getByRole('button', { name: 'Close' });
    pointer(close, 'pointerDown', 700);
    pointer(close, 'pointerMove', 400);
    expect(sheet.style.height).not.toMatch(/px$/);
    expect(sheet.getAttribute('data-stop')).toBe('0');
  });

  it('the sheet sits on the modal layer, under portaled dropdowns', async () => {
    renderPanel(<MapPanel {...floatProps({ offsetBottom: 35 })} />);
    const sheet = await findSheet();
    expect(sheet.style.zIndex).toBe('200');
    expect(sheet.style.maxWidth).toBe('none');
    expect(sheet.style.bottom).toBe('35px');
  });

  it('float puts the closed pill at the bottom centre above the attribution', async () => {
    renderPanel(<MapPanel {...floatProps({ opened: false, offsetBottom: 40 })} />);
    const pill = (await screen.findByText('Abrir')).closest('.ads-mappanel-pill--mobile') as HTMLElement;
    expect(pill).toBeTruthy();
    expect(pill.style.bottom).toBe('108px');
  });

  it('dock keeps the Drawer and moves its pill to the bottom', async () => {
    const { rerender } = renderPanel(<MapPanel {...dockProps({ opened: false, offsetBottom: 40 })} />);
    const pill = (await screen.findByText('Abrir')).closest('.ads-mappanel-pill--mobile');
    expect(pill).toBeTruthy();
    rerender(
      <MantineProvider theme={adsBaseTheme}>
        <MapPanel {...dockProps({ opened: true })} />
      </MantineProvider>
    );
    expect(await screen.findByText('Conteúdo')).toBeTruthy();
    expect(document.querySelector('.mantine-Drawer-content')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Painel' })).toBeNull();
  });

  it('mobile="off" keeps the float card', async () => {
    renderPanel(<MapPanel {...floatProps({ mobile: 'off' })} />);
    expect(await screen.findByText('Conteúdo')).toBeTruthy();
    expect(document.querySelector('.ads-mappanel-sheet')).toBeNull();
  });
});
