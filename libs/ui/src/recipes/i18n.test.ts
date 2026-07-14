/**
 * The "i18n-aware defaults" contract (plan §1c): recipe strings resolve in
 * the app language at call time, registered on the host i18next singleton —
 * the same instance the shells initialise (apps/<app>/src/app/core/i18n).
 */
import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

import { UI_NAMESPACE, uiText } from './i18n';

describe('uiText', () => {
  it('falls back to the built-in string while i18next is uninitialised', () => {
    expect(i18next.isInitialized).toBeFalsy();
    expect(uiText('confirm.yes', 'Yes')).toBe('Yes');
  });

  it('resolves pt strings once the host i18next is up (registration is lazy)', async () => {
    await i18next.init({ lng: 'pt', fallbackLng: 'en', resources: {} });

    expect(uiText('confirm.yes', 'Yes')).toBe('Sim');
    expect(uiText('notify.warn', 'Warning')).toBe('Aviso');
    expect(uiText('upload.choose', 'Choose')).toBe('Escolher');
    expect(i18next.hasResourceBundle('pt', UI_NAMESPACE)).toBe(true);
  });

  it('follows a language switch at call time — imperative calls stay current', async () => {
    await i18next.changeLanguage('en');
    expect(uiText('confirm.no', 'No')).toBe('No');

    await i18next.changeLanguage('pt');
    expect(uiText('confirm.no', 'No')).toBe('Não');
  });

  it('resolves pt-PT through i18next language fallback to the pt bundle', async () => {
    await i18next.changeLanguage('pt-PT');
    expect(uiText('notify.success', 'Success')).toBe('Sucesso');
  });

  it('returns the fallback for a key that is not in the dictionaries', () => {
    expect(uiText('confirm.nonexistent', 'Fallback')).toBe('Fallback');
  });
});
