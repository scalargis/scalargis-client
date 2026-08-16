/* =====================================================================
   AdsProviders — the single Mantine mount point for both app shells
   (viewer app.jsx, backoffice app.jsx). Mounted once in Phase 1,
   removed never (migration2/mantine/02-phase-1-foundations.md §1a).

   This module also owns the Mantine side of the CSS import order:
     Prime globals → Mantine core styles → ads-tokens.css → ads-globals.css
   The shells guarantee the Prime half by importing their Prime global
   stylesheets BEFORE importing anything from @scalargis/ui.
   ===================================================================== */

/* Noto Sans — the sole ADS family; self-hosted, no font CDN on
   public-sector deploys. Weights per the ADS type scale. */
import '@fontsource/noto-sans/300.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';

/* primeicons — kept permanently by plan decision (mantine/README.md
   §decisions); the recipes render pi classes via recipes/icons.tsx, so the
   lib loads the font itself instead of assuming the shell still does. The
   shells import it earlier anyway (Prime globals), so this dedupes. */
import 'primeicons/primeicons.css';

/* Mantine core + sub-package styles, then the ADS layers on top. */
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import 'mantine-datatable/styles.css';
import './theme/ads-tokens.css';
import './theme/ads-globals.css';
import './theme/ads-components.css';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import 'dayjs/locale/pt';

import { adsBaseTheme, adsCssVariablesResolver } from './theme/ads-mantine-theme';
import { applyMotionPreference, motionDurations } from './theme/motion';
import {
  ClientThemeRegistryProvider,
  useClientThemeManager,
} from './theme/client-theme-registry';
import { DIALOG_DEFAULTS } from './recipes/dialogDefaults';
import { registerUiTranslations } from './recipes/i18n';

export interface AdsProvidersProps {
  children: React.ReactNode;
}

export function AdsProviders({ children }: AdsProvidersProps) {
  // Client-theme channel (B2): a ThemeSelector deep in the tree registers
  // the deploy's palette preset (or a theme module's override) here, and it
  // must land on THIS provider — a nested MantineProvider would leave every
  // body-portaled overlay (modals, dropdowns, toasts) on the base theme.
  const { registry, active: activeClientTheme } = useClientThemeManager();
  // Follows the app language live (i18next); @mantine/dates runs on dayjs.
  // resolvedLanguage only materialises once translations for the language
  // are loaded (the shells init with resources:{} and add bundles after),
  // so fall back to the requested language rather than defaulting wrong.
  const { i18n } = useTranslation();
  const activeLanguage = i18n?.resolvedLanguage ?? i18n?.language;
  const locale = activeLanguage?.startsWith('pt') ? 'pt' : 'en';

  // <html lang> follows the active i18next language (kit 04 §screen-reader:
  // WCAG 3.1.1 — the document lang must flip with the content language so
  // screen readers switch pronunciation). The tag is already valid BCP-47
  // ('pt', 'pt-PT', 'en'); until i18next has one, the shell's static
  // index.html lang stands.
  React.useEffect(() => {
    if (activeLanguage) document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  // data-sg-motion on <html>: the project-level motion switch (theme/motion.ts
  // — THE central control). ads-globals.css reduces all motion under
  // "reduced"; the OS prefers-reduced-motion path works regardless.
  React.useEffect(() => {
    applyMotionPreference();
  }, []);

  // Recipe default strings (scalargis_ui namespace) onto the host i18next.
  registerUiTranslations();

  return (
    // ADS is a light-only system — a dark scheme would be its own spec,
    // not a client override (kit 05 §what this mapping does NOT do).
    <MantineProvider
      theme={activeClientTheme?.theme ?? adsBaseTheme}
      cssVariablesResolver={adsCssVariablesResolver}
      forceColorScheme="light"
    >
      <DatesProvider settings={{ locale }}>
        {/* Modals opened imperatively (modals.openConfirmModal, our confirm()
            recipe) bypass the theme's Modal defaultProps — ModalsProvider
            constructs them itself. The ADS ladder + centring + motion come
            from the one shared DIALOG_DEFAULTS the Dialog recipe reads too,
            so the two can't drift (R4). */}
        <ModalsProvider modalProps={DIALOG_DEFAULTS}>
          {/* ADS toast layer: z 7000, above dialogs (6000), below tooltips.
              Slide pace from the motion tokens (Prime's Toast entered at .3s). */}
          <Notifications
            position="top-right"
            zIndex={7000}
            transitionDuration={motionDurations.slow}
          />
          <ClientThemeRegistryProvider registry={registry}>
            {children}
          </ClientThemeRegistryProvider>
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  );
}
