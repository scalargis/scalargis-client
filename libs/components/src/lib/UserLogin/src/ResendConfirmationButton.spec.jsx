import React from 'react';
import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import i18next from 'i18next';

import ResendConfirmationButton from './ResendConfirmationButton';


const render = (ui) => rtlRender(<MantineProvider>{ui}</MantineProvider>);
const button = () => screen.getByRole('button');

const wait = async (seconds) => {
  for (let i = 0; i < seconds; i++) {
    await act(async () => { vi.advanceTimersByTime(1000); });
  }
};

const click = async () => {
  await act(async () => { fireEvent.click(button()); });
};

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query) => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => false
  }));

  i18next.init({
    lng: 'pt',
    fallbackLng: 'pt',
    defaultNS: 'common',
    resources: {},
    interpolation: { escapeValue: false }
  });
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});


describe('ResendConfirmationButton', () => {

  it('waits the cooldown before the first send', async () => {
    const onResend = vi.fn(() => Promise.resolve({}));
    render(<ResendConfirmationButton onResend={onResend} cooldown={3} />);

    expect(button().disabled).toBe(true);
    expect(screen.getByText('Reenviar email (3 s)')).toBeTruthy();

    await wait(1);
    expect(screen.getByText('Reenviar email (2 s)')).toBeTruthy();

    await wait(2);
    expect(button().disabled).toBe(false);
    expect(screen.getByText('Reenviar email')).toBeTruthy();
    expect(onResend).not.toHaveBeenCalled();
  });

  it('sends, says so, and starts the cooldown again', async () => {
    const onResend = vi.fn(() => Promise.resolve({}));
    render(<ResendConfirmationButton onResend={onResend} cooldown={2} />);
    await wait(2);

    await click();

    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByText('O email de ativação foi enviado novamente.')).toBeTruthy();
    expect(button().disabled).toBe(true);
    expect(screen.getByText('Reenviar email (2 s)')).toBeTruthy();
  });

  it('shows the default hint or none', () => {
    const { unmount } = render(<ResendConfirmationButton onResend={vi.fn()} />);
    expect(screen.getByText('Não recebeu o email? Verifique a pasta de SPAM ou peça um novo email.')).toBeTruthy();
    unmount();

    render(<ResendConfirmationButton onResend={vi.fn()} hint={null} />);
    expect(screen.queryByText('Não recebeu o email? Verifique a pasta de SPAM ou peça um novo email.')).toBeNull();
  });

  it('shows the service error when the send fails', async () => {
    const onResend = vi.fn(() => Promise.reject(new Error('500')));
    render(<ResendConfirmationButton onResend={onResend} cooldown={1} />);
    await wait(1);

    await click();

    expect(screen.getByText('Serviço Indisponível')).toBeTruthy();
    expect(screen.queryByText('O email de ativação foi enviado novamente.')).toBeNull();
  });
});
