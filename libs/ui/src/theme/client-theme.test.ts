import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from './ads-mantine-theme';
import { createClientTheme } from './client-theme';

const BRAND: readonly string[] = [
  '#FFF5F5', '#FFE3E3', '#FFC9C9', '#FFA8A8', '#FF8787',
  '#FF6B6B', '#FA5252', '#F03E3E', '#E03131', '#C92A2A',
];

describe('createClientTheme', () => {
  it('keeps every ADS-immutable key from the base theme', () => {
    const theme = createClientTheme({ primary: BRAND as never, secondary: BRAND as never });
    expect(theme.colors?.primary).toEqual(BRAND);
    expect(theme.colors?.warning).toEqual(adsBaseTheme.colors?.warning);
    expect(theme.colors?.neutral).toEqual(adsBaseTheme.colors?.neutral);
    expect(theme.spacing).toEqual(adsBaseTheme.spacing);
    expect(theme.fontSizes).toEqual(adsBaseTheme.fontSizes);
    expect(theme.scale).toBe(adsBaseTheme.scale);
  });

  it('throws on a key outside the contract or a partial palette', () => {
    expect(() => createClientTheme({ primary: BRAND, spacing: { md: '10px' } } as never)).toThrow(
      /outside the override contract/
    );
    expect(() => createClientTheme({ colors: {} } as never)).toThrow(/outside the override contract/);
    expect(() => createClientTheme({ primary: ['#FF6B6B', '#FA5252'] as never })).toThrow(
      /10-shade tuple/
    );
  });
});
