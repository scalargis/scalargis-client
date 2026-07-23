/**
 * AdsProviders document-language contract (kit 04 §screen-reader / WCAG
 * 3.1.1): <html lang> is stamped with the active i18next language on mount
 * and follows every live language switch.
 */
import React from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { act, render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { AdsProviders } from './AdsProviders';

beforeAll(async () => {
  // The host-shell shape: react-i18next bound to the i18next singleton,
  // initialised with a region tag and no preloaded resources.
  await i18next
    .use(initReactI18next)
    .init({ lng: 'pt-PT', fallbackLng: 'en', resources: {} });
});

describe('AdsProviders <html lang>', () => {
  it('stamps the document language on mount', () => {
    render(
      <AdsProviders>
        <span>content</span>
      </AdsProviders>
    );

    expect(document.documentElement.lang).toBe('pt-PT');
  });

  it('follows a live language switch', async () => {
    render(
      <AdsProviders>
        <span>content</span>
      </AdsProviders>
    );

    await act(async () => {
      await i18next.changeLanguage('en');
    });
    expect(document.documentElement.lang).toBe('en');

    // With the scalargis_ui bundles registered (mount did that), pt-PT
    // resolves to the pt bundle — resolvedLanguage, the language actually
    // rendering, is what the document should declare.
    await act(async () => {
      await i18next.changeLanguage('pt-PT');
    });
    expect(document.documentElement.lang).toBe('pt');
  });
});
