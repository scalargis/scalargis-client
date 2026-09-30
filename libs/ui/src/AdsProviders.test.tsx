/**
 * AdsProviders document-language contract (WCAG
 * 3.1.1): <html lang> is stamped with the active i18next language on mount
 * and follows every live language switch.
 *
 * Plus the client-theme registry contract (B2): a theme applied deep in the
 * tree re-themes the ROOT provider (so portaled overlays inherit it) and
 * stamps data-sg-theme; nested contributions let the inner selector win.
 */
import React from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useMantineTheme } from '@mantine/core';
import { act, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { AdsProviders } from './AdsProviders';
import { resolveClientThemePreset } from './theme/presets';
import { useApplyClientTheme, type ClientThemeEntry } from './theme/client-theme-registry';

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

describe('AdsProviders motion switch', () => {
  // The delivery half of the central motion control (theme/motion.ts):
  // ads-globals.css keys its project-level reduced-motion block on this
  // attribute, so an unstamped document would make the switch a no-op.
  it('stamps the project motion preference on <html>', () => {
    render(
      <AdsProviders>
        <span>content</span>
      </AdsProviders>
    );

    expect(document.documentElement.dataset.sgMotion).toBe('full');
  });
});

/* ─── client-theme registry ──────────────────────────────────────────── */

function Contribute({ entry }: { entry: ClientThemeEntry | null | undefined }) {
  useApplyClientTheme(entry);
  return null;
}

function ThemeProbe() {
  const theme = useMantineTheme();
  return (
    <span data-testid="probe">
      {theme.colors.primary[5]}|{String(theme.primaryShade)}
    </span>
  );
}

describe('AdsProviders client-theme registry', () => {
  const lime = resolveClientThemePreset('lime')!;
  const red = resolveClientThemePreset('red')!;

  it('re-themes the root provider and stamps data-sg-theme; unmount restores', () => {
    const { rerender } = render(
      <AdsProviders>
        <Contribute entry={{ name: lime.name, theme: lime.theme }} />
        <ThemeProbe />
      </AdsProviders>
    );
    expect(screen.getByTestId('probe').textContent).toBe('#9EC222|7');
    expect(document.documentElement.dataset.sgTheme).toBe('lime');

    rerender(
      <AdsProviders>
        <ThemeProbe />
      </AdsProviders>
    );
    expect(screen.getByTestId('probe').textContent).toBe('#1A65FA|5');
    expect(document.documentElement.dataset.sgTheme).toBeUndefined();
  });

  it('lets the inner (viewer-level) contribution win over the outer (site) one', () => {
    // The RGPD/Layout nesting: site theme registers first, viewer theme
    // second — the viewer's wins while mounted, the site's returns after.
    const { rerender } = render(
      <AdsProviders>
        <Contribute entry={{ name: red.name, theme: red.theme }} />
        <div>
          <Contribute entry={{ name: lime.name, theme: lime.theme }} />
        </div>
        <ThemeProbe />
      </AdsProviders>
    );
    expect(screen.getByTestId('probe').textContent).toBe('#9EC222|7');
    expect(document.documentElement.dataset.sgTheme).toBe('lime');

    rerender(
      <AdsProviders>
        <Contribute entry={{ name: red.name, theme: red.theme }} />
        <ThemeProbe />
      </AdsProviders>
    );
    expect(screen.getByTestId('probe').textContent).toBe('#C62828|5');
    expect(document.documentElement.dataset.sgTheme).toBe('red');
  });
});
