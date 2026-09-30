/* =====================================================================
   The sellable client-theme palette (Phase 4 / Batch 2).

   Six presets a deploy can pick by name (SITE_CONFIG.theme, a viewer's
   config_json.theme, or VITE_APP_DEFAULT_THEME): the ADS default plus
   five brand re-skins, every one built through createClientTheme so the
   override contract stays enforced by construction. This file is the
   palette DATA, locked by the AA gate in presets.test.ts; what the viewer
   loads by name are the theme module folders that front these presets
   (apps/viewer/src/app/themes/<name>). The in-repo how-to is the viewer's themes
   README (apps/viewer/src/app/themes/README.md).

   Every tuple keeps the TRUE brand hex at index 5 (ADS 500 = "main"),
   because the brand chrome (viewer topbar/footer/splash, the map-control
   strip) always paints with primary-5. `primaryShade` then decides what
   filled controls, links and text accents use: where white-on-500 fails
   4.5:1 (the bright hues) it points at the first shade that passes, so
   the SAME theme keeps the bright brand chrome and AA-legible controls —
   matching how the bright-brand deploys have always looked.

   Measured white↔shade ratios (WCAG 2.x sRGB; locked by presets.test.ts):

   | preset     | 500 (chrome) | white↔500 | shade | white↔shade |
   |------------|--------------|-----------|-------|-------------|
   | default    | #1A65FA      | 4.90 AA   | 5     | 4.90 AA     |
   | lime       | #9EC222      | 2.06 ✗*   | 7     | 5.33 AA     |
   | cyan       | #37B2DF      | 2.44 ✗*   | 7     | 5.74 AA     |
   | red        | #C62828      | 5.62 AA   | 5     | 5.62 AA     |
   | dark-green | #0E7A46      | 5.40 AA   | 5     | 5.40 AA     |
   | brown      | #B08968      | 3.17 ⚠**  | 7     | 7.28 AA     |

   *  Bright chrome carrying white text is a documented deviation of the
      bright-brand looks (a theme that ships it does not claim ADS
      adherence). Interactive/text surfaces sit at shade 7 and pass.
   ** ≥3:1, so white on the brown chrome passes as large-text/UI only.
   ===================================================================== */

/* Saira — the brand family the lime/cyan presets carry (their deploys
   shipped it via @fontsource in the Prime era). Same weights as the Noto
   set in AdsProviders; being @font-face rules, the files only download
   when a Saira theme is active, so bundling these imports costs the other
   deploys a few KB of CSS and zero font traffic. */
import '@fontsource/saira/400.css';
import '@fontsource/saira/500.css';
import '@fontsource/saira/600.css';
import '@fontsource/saira/700.css';

import type {
  MantineColorShade,
  MantineColorsTuple,
  MantineThemeOverride,
} from '@mantine/core';

import { adsBaseTheme } from './ads-mantine-theme';
import { createClientTheme } from './client-theme';

const SAIRA = 'Saira, "Noto Sans", sans-serif';

export interface ClientThemePreset {
  /** Config slug — what SITE_CONFIG.theme / config_json.theme carries. */
  name: string;
  /** Human name for pickers/docs. */
  label: string;
  /** The brand hex = tuple[5] = what the chrome paints with. */
  brand: string;
  /** Index filled controls/links/text accents use (the AA-passing one). */
  primaryShade: MantineColorShade;
  /** Brand family, when the preset carries one (lime/cyan ship Saira). */
  fontFamily?: string;
  /** The merged Mantine theme — hand this to the provider. */
  theme: MantineThemeOverride;
}

/* Ramps generated around the brand 500 on the ADS primary curve (tints =
   sRGB mixes toward white, darks = HSL lightness walk to ~0.3·L500) and
   frozen here as data, like the base palettes. Regenerate only with a new
   contrast run — presets.test.ts fails on any shade that breaks the gate. */

const LIME_PRIMARY: MantineColorsTuple = [
  '#FBFCF5', '#F7FAED', '#F2F7E2', '#E3EDC0', '#BCD567',
  '#9EC222', '#7E9B1B', '#5E7314', '#4C5E10', '#2F3A0A',
];

const CYAN_PRIMARY: MantineColorsTuple = [
  '#F6FCFE', '#EFF9FC', '#E5F5FB', '#C6E9F6', '#75CAE9',
  '#37B2DF', '#1F94BF', '#176E8E', '#125A74', '#0C3848',
];

const RED_PRIMARY: MantineColorsTuple = [
  '#FCF5F5', '#FAEEEE', '#F8E3E3', '#EFC1C1', '#D86B6B',
  '#C62828', '#9E2020', '#761818', '#5F1313', '#3B0C0C',
];

const DARK_GREEN_PRIMARY: MantineColorsTuple = [
  '#F4F9F7', '#ECF4F0', '#E0EEE7', '#BAD9CA', '#59A380',
  '#0E7A46', '#0B6339', '#094B2B', '#073E24', '#052918',
];

const BROWN_PRIMARY: MantineColorsTuple = [
  '#FBFAF8', '#F9F6F3', '#F5F0EB', '#E8DDD4', '#C9AE97',
  '#B08968', '#936D4D', '#6D5139', '#59422E', '#37291D',
];

export const clientThemePresets: readonly ClientThemePreset[] = [
  {
    // The anchor: ADS as shipped. No override object at all — this preset
    // IS adsBaseTheme, so "default" can never drift from the base.
    name: 'default',
    label: 'ADS (default)',
    brand: '#1A65FA',
    primaryShade: 5,
    theme: adsBaseTheme,
  },
  {
    name: 'lime',
    label: 'Lime green',
    brand: '#9EC222',
    primaryShade: 7,
    fontFamily: SAIRA,
    theme: createClientTheme({
      primary: LIME_PRIMARY,
      // #9EC222 is 2.06:1 with white — shade 7 (#5E7314, 5.33:1) is the
      // first that passes; 6 is 3.19. Chrome stays on the bright 500.
      primaryShade: 7,
      fontFamily: SAIRA,
    }),
  },
  {
    name: 'cyan',
    label: 'Cyan blue',
    brand: '#37B2DF',
    primaryShade: 7,
    fontFamily: SAIRA,
    theme: createClientTheme({
      primary: CYAN_PRIMARY,
      // #37B2DF is 2.44:1 with white — shade 7 (#176E8E, 5.74:1) is the
      // first that passes; 6 is 3.47. Chrome stays on the bright 500.
      primaryShade: 7,
      fontFamily: SAIRA,
    }),
  },
  {
    name: 'red',
    label: 'Red',
    brand: '#C62828',
    primaryShade: 5,
    // 500 passes both directions (5.62:1) — no shade bump, no font:
    // a colour-only re-brand that stays on ADS type.
    theme: createClientTheme({ primary: RED_PRIMARY }),
  },
  {
    name: 'dark-green',
    label: 'Dark green',
    brand: '#0E7A46',
    primaryShade: 5,
    // 500 passes both directions (5.40:1) — colour-only, ADS type.
    theme: createClientTheme({ primary: DARK_GREEN_PRIMARY }),
  },
  {
    name: 'brown',
    label: 'Light brown',
    brand: '#B08968',
    primaryShade: 7,
    theme: createClientTheme({
      primary: BROWN_PRIMARY,
      // #B08968 is 3.17:1 with white — UI/large-text only. Shade 6 scrapes
      // by at 4.63 with less headroom than the ADS base keeps for its own
      // 500 (4.90), so interactive surfaces sit at 7 (#6D5139, 7.28:1).
      primaryShade: 7,
    }),
  },
];

/** Look a preset up by its config slug (siteConfig.theme etc.). */
export function resolveClientThemePreset(
  name: string | null | undefined
): ClientThemePreset | undefined {
  if (!name) return undefined;
  return clientThemePresets.find((preset) => preset.name === name);
}
