import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi } from 'vitest';

import Main from './Main';

// O barrel `../../components` puxa a lib inteira; aqui só interessa o trigger.
vi.mock('../../components', () => ({ MainMenuButton: () => null }));
vi.mock('./ContactForm', () => ({ default: () => <div data-testid="contact-form" /> }));
vi.mock('./ContactInfo', () => ({ default: () => null }));
const dialogSizes = [];
let phone = false;
vi.mock('@scalargis/ui', async (importOriginal) => {
  const ui = await importOriginal();
  return {
    ...ui,
    useIsMobile: () => phone,
    Dialog: (p) => {
      dialogSizes.push(p.size);
      return <ui.Dialog {...p} />;
    }
  };
});
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, i18n: {} })
}));

// O jsdom não traz `matchMedia` e o MantineProvider chama-o ao montar.
// Fica local ao spec para não mexer na config partilhada da lib.
beforeAll(() => {
  window.matchMedia = window.matchMedia || (query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => false
  }));
});

const props = (region, config_json = {}) => ({
  region,
  as: 'popup',
  core: {},
  actions: {},
  record: { id: 'contactform', title: '', config_json },
  config: {
    viewer: { id: 1 },
    dispatch: vi.fn(),
    Models: { Utils: { getWindowSize: () => [1200, 800] } }
  }
});

const renderMain = (region, config_json) =>
  render(
    <MantineProvider>
      <Main {...props(region, config_json)} />
    </MantineProvider>
  );

describe('ContactForm Main', () => {

  it('renderiza o trigger do rodapé nas regiões footer_left/footer_right', () => {
    const { container, unmount } = renderMain('footer_left');
    expect(container.querySelector('.contactform-footer-button')).toBeTruthy();
    // O markup do topbar não pode aparecer no rodapé: pinta à escala errada.
    expect(container.querySelector('.layout-topbar-icon')).toBeNull();
    expect(container.querySelector('.contactform-footer-icon')).toBeTruthy();
    unmount();

    const { container: right } = renderMain('footer_right');
    expect(right.querySelector('.contactform-footer-button')).toBeTruthy();
  });

  it('mantém o markup do topbar nas outras regiões', () => {
    const { container } = renderMain('topbar_right');
    expect(container.querySelector('.layout-topbar-icon')).toBeTruthy();
    expect(container.querySelector('.contactform-footer-button')).toBeNull();
  });

  it('usa footerLabel e deixa "" esconder o label sem perder o trigger', () => {
    const { container, unmount } = renderMain('footer_left', { footerLabel: 'Fale connosco' });
    expect(container.querySelector('.contactform-footer-label').textContent).toBe('Fale connosco');
    unmount();

    const { container: noLabel } = renderMain('footer_left', { footerLabel: '' });
    expect(noLabel.querySelector('.contactform-footer-label')).toBeNull();
    expect(noLabel.querySelector('.contactform-footer-button')).toBeTruthy();
  });

  it('abre o mesmo modal a partir do trigger do rodapé', async () => {
    const { container } = renderMain('footer_left');

    expect(screen.queryByTestId('contact-form')).toBeNull();
    fireEvent.click(container.querySelector('.contactform-footer-button'));
    expect(await screen.findByTestId('contact-form')).toBeTruthy();
  });

  it('passes only the desktop size to the Dialog on a phone', async () => {
    phone = true;
    dialogSizes.length = 0;
    const { container } = renderMain('footer_left');
    fireEvent.click(container.querySelector('.contactform-footer-button'));
    await screen.findByTestId('contact-form');
    phone = false;
    expect(dialogSizes.length).toBeGreaterThan(0);
    expect(dialogSizes.every(size => size === '45vw')).toBe(true);
  });

});
