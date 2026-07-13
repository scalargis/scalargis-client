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
import { registerUiTranslations } from './recipes/i18n';

export interface AdsProvidersProps {
  children: React.ReactNode;
}

export function AdsProviders({ children }: AdsProvidersProps) {
  // Follows the app language live (i18next); @mantine/dates runs on dayjs.
  const { i18n } = useTranslation();
  const locale = i18n?.resolvedLanguage?.startsWith('pt') ? 'pt' : 'en';

  // Recipe default strings (scalargis_ui namespace) onto the host i18next.
  registerUiTranslations();

  return (
    // ADS is a light-only system — a dark scheme would be its own spec,
    // not a client override (kit 05 §what this mapping does NOT do).
    <MantineProvider
      theme={adsBaseTheme}
      cssVariablesResolver={adsCssVariablesResolver}
      forceColorScheme="light"
    >
      <DatesProvider settings={{ locale }}>
        {/* Modals opened imperatively (modals.openConfirmModal, our confirm()
            recipe) bypass the theme's Modal defaultProps — ModalsProvider
            constructs them itself. Re-state the ADS ladder + centring here. */}
        <ModalsProvider modalProps={{ centered: true, zIndex: 6000 }}>
          {/* ADS toast layer: z 7000, above dialogs (6000), below tooltips. */}
          <Notifications position="top-right" zIndex={7000} />
          {children}
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  );
}
