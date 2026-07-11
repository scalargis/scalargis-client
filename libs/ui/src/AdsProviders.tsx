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

/* Mantine core + sub-package styles, then the ADS layers on top. */
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import 'mantine-datatable/styles.css';
import './theme/ads-tokens.css';
import './theme/ads-globals.css';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import 'dayjs/locale/pt';

import { adsBaseTheme } from './theme/ads-mantine-theme';

export interface AdsProvidersProps {
  children: React.ReactNode;
}

export function AdsProviders({ children }: AdsProvidersProps) {
  // Follows the app language live (i18next); @mantine/dates runs on dayjs.
  const { i18n } = useTranslation();
  const locale = i18n?.resolvedLanguage?.startsWith('pt') ? 'pt' : 'en';

  return (
    // ADS is a light-only system — a dark scheme would be its own spec,
    // not a client override (kit 05 §what this mapping does NOT do).
    <MantineProvider theme={adsBaseTheme} forceColorScheme="light">
      <DatesProvider settings={{ locale }}>
        <ModalsProvider>
          {/* ADS toast layer: z 7000, above dialogs (6000), below tooltips. */}
          <Notifications position="top-right" zIndex={7000} />
          {children}
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  );
}
