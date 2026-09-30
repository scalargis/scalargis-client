/* =====================================================================
   createClientTheme — the ONLY way a client re-skin (a themes/<name>
   module — Phase 4) or a palette preset (theme/presets.ts — B2)
   derives its theme from the ADS base.

   The override contract allows a client theme to set colors.primary,
   colors.secondary, — with written justification — primaryShade, and,
   for client-BRANDED themes only, the font family. NOTHING else:
   foundation palettes, sizing, spacing, radius, breakpoints and the
   focus ring are immutable (ADS §2.5.3/2.5.4, DL 49/2024). This helper
   makes that boundary mechanical instead of review-enforced: the
   contract's fields are the only ones that reach the merge, and
   anything extra throws at module-load time — a client theme needing
   more is an escalation, not a merge.

   THE FONT CLAUSE (B2, 2026-07-16 decision): a brand theme may carry
   its own family (the Prime-era brand themes shipped Saira), which
   deviates from the ADS "typography immutable" rule. That is sanctioned
   ONLY because client-branded themes never claim ADS adherence — the
   default/ADS theme keeps ADS type, and a theme that wants the Selo
   route must not set it. Loading the font files (@fontsource import)
   is the theme's own job; the override just names the family.

   After every re-brand, re-run the AA pairing checks against the
   new hues (white-on-primary-500 and primary-500-on-white at minimum) —
   a light/bright brand colour fails 4.5:1 with white and forces a
   primaryShade bump (the shipped bright presets sit at 7).
   ===================================================================== */

import {
  mergeThemeOverrides,
  type MantineColorShade,
  type MantineColorsTuple,
  type MantineThemeOverride,
} from '@mantine/core';

import { adsBaseTheme } from './ads-mantine-theme';

export interface ClientThemeOverride {
  /** Brand primary — a full 10-shade tuple (ADS 50→900 = index 0→9). */
  primary?: MantineColorsTuple;
  /** Brand secondary — a full 10-shade tuple. */
  secondary?: MantineColorsTuple;
  /**
   * Only with written justification: bump to the first shade that
   * clears 4.5:1 with white when the brand's 500 fails the AA check, so
   * filled controls, links and text accents darken while the bright 500
   * stays available for brand chrome (the shipped bright presets use 7).
   */
  primaryShade?: MantineColorShade;
  /**
   * Brand font family (client-BRANDED themes only — deviates from ADS
   * type, see the font clause above). Applies to body text and, unless
   * `headingsFontFamily` says otherwise, headings too. The theme itself
   * must import the font's @fontsource files.
   */
  fontFamily?: string;
  /** Headings-only family; defaults to `fontFamily` when omitted. */
  headingsFontFamily?: string;
}

const ALLOWED_KEYS = [
  'primary',
  'secondary',
  'primaryShade',
  'fontFamily',
  'headingsFontFamily',
];

function assertTuple(name: string, tuple: MantineColorsTuple): void {
  if (!Array.isArray(tuple) || tuple.length !== 10) {
    throw new Error(
      `createClientTheme: colors.${name} must be a full 10-shade tuple ` +
        `(ADS 50→900); got ${Array.isArray(tuple) ? tuple.length : typeof tuple}. ` +
        'Partial palettes break shade-indexed pairings.'
    );
  }
}

function assertFamily(name: string, family: string): void {
  if (typeof family !== 'string' || family.trim() === '') {
    throw new Error(
      `createClientTheme: ${name} must be a non-empty font-family string ` +
        '(e.g. \'Saira, "Noto Sans", sans-serif\').'
    );
  }
}

export function createClientTheme(override: ClientThemeOverride): MantineThemeOverride {
  const rejected = Object.keys(override).filter((key) => !ALLOWED_KEYS.includes(key));
  if (rejected.length > 0) {
    // Client themes live in plain-JS submodules, so the TypeScript surface
    // alone does not protect them — fail loudly, at load, in every build.
    throw new Error(
      `createClientTheme: [${rejected.join(', ')}] is outside the override ` +
        'contract — only primary, secondary, primaryShade and the font ' +
        'family may change (everything else is ADS-immutable).'
    );
  }

  const { primary, secondary, primaryShade, fontFamily, headingsFontFamily } = override;
  if (primary) assertTuple('primary', primary);
  if (secondary) assertTuple('secondary', secondary);
  if (fontFamily !== undefined) assertFamily('fontFamily', fontFamily);
  if (headingsFontFamily !== undefined) assertFamily('headingsFontFamily', headingsFontFamily);

  const headingsFamily = headingsFontFamily ?? fontFamily;

  return mergeThemeOverrides(adsBaseTheme, {
    colors: {
      ...(primary && { primary }),
      ...(secondary && { secondary }),
    },
    ...(primaryShade !== undefined && { primaryShade }),
    ...(fontFamily && { fontFamily }),
    // mergeThemeOverrides deep-merges, so the ADS headings sizes/weights
    // survive — only the family moves (sizing stays immutable).
    ...(headingsFamily && { headings: { fontFamily: headingsFamily } }),
  });
}
