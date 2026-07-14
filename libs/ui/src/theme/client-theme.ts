/* =====================================================================
   createClientTheme — the ONLY way a client re-skin (themes/snic3,
   themes/mapaspt — Phase 4) derives its theme from the ADS base.

   The kit's override contract (ads-adherence-restrictions/
   05-mantine-mapping.md §override contract) allows a client theme to set
   colors.primary, colors.secondary and — with written justification —
   primaryShade. NOTHING else: foundation palettes, type, spacing,
   radius, breakpoints and the focus ring are immutable (ADS §2.5.3/2.5.4,
   DL 49/2024). This helper makes that boundary mechanical instead of
   review-enforced: the contract's three fields are the only ones that
   reach the merge, and anything extra throws at module-load time —
   a client theme needing more is an escalation, not a merge.

   After every re-brand, re-run the kit 02 AA pairing checks against the
   new hues (white-on-primary-500 and primary-500-on-white at minimum) —
   a light brand colour fails 4.5:1 with white and forces primaryShade: 6.
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
   * Only with written justification (kit 05): bump to 6 when the brand's
   * 500 fails the white-text AA check, so filled controls darken a step.
   */
  primaryShade?: MantineColorShade;
}

const ALLOWED_KEYS = ['primary', 'secondary', 'primaryShade'];

function assertTuple(name: string, tuple: MantineColorsTuple): void {
  if (!Array.isArray(tuple) || tuple.length !== 10) {
    throw new Error(
      `createClientTheme: colors.${name} must be a full 10-shade tuple ` +
        `(ADS 50→900); got ${Array.isArray(tuple) ? tuple.length : typeof tuple}. ` +
        'Partial palettes break shade-indexed pairings (kit 02 §indexing).'
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
        'contract — only primary, secondary and primaryShade may change ' +
        '(kit 05 §override contract; everything else is ADS-immutable).'
    );
  }

  const { primary, secondary, primaryShade } = override;
  if (primary) assertTuple('primary', primary);
  if (secondary) assertTuple('secondary', secondary);

  return mergeThemeOverrides(adsBaseTheme, {
    colors: {
      ...(primary && { primary }),
      ...(secondary && { secondary }),
    },
    ...(primaryShade !== undefined && { primaryShade }),
  });
}
