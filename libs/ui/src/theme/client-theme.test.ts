import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from './ads-mantine-theme';
import { createClientTheme } from './client-theme';

const BRAND: readonly string[] = [
  '#FFF5F5', '#FFE3E3', '#FFC9C9', '#FFA8A8', '#FF8787',
  '#FF6B6B', '#FA5252', '#F03E3E', '#E03131', '#C92A2A',
];

describe('createClientTheme (kit 05 override contract)', () => {
  it('merges a brand primary over the base theme', () => {
    const theme = createClientTheme({ primary: BRAND as never });
    expect(theme.colors?.primary).toEqual(BRAND);
    // The base object must not be mutated by the merge.
    expect(adsBaseTheme.colors?.primary?.[5]).toBe('#1A65FA');
  });

  it('keeps every ADS-immutable key from the base theme', () => {
    const theme = createClientTheme({ primary: BRAND as never, secondary: BRAND as never });
    expect(theme.colors?.warning).toEqual(adsBaseTheme.colors?.warning);
    expect(theme.colors?.neutral).toEqual(adsBaseTheme.colors?.neutral);
    expect(theme.spacing).toEqual(adsBaseTheme.spacing);
    expect(theme.scale).toBe(adsBaseTheme.scale);
    expect(theme.fontFamily).toBe(adsBaseTheme.fontFamily);
    expect(theme.primaryShade).toBe(5);
  });

  it('lets primaryShade move (the written-justification escape)', () => {
    expect(createClientTheme({ primary: BRAND as never, primaryShade: 6 }).primaryShade).toBe(6);
  });

  it('throws on any key outside the contract', () => {
    expect(() =>
      createClientTheme({ primary: BRAND, spacing: { md: '10px' } } as never)
    ).toThrow(/outside the override contract/);
    expect(() => createClientTheme({ colors: {} } as never)).toThrow(
      /outside the override contract/
    );
  });

  it('throws on a partial palette — shade-indexed pairings would break', () => {
    expect(() =>
      createClientTheme({ primary: ['#FF6B6B', '#FA5252'] as never })
    ).toThrow(/10-shade tuple/);
  });
});
