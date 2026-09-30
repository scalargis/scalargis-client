/**
 * The palette's AA gate, mechanized:
 * for every shipped preset, white↔primary[primaryShade] must clear 4.5:1
 * in both directions — this is the check that made the bright brands bump
 * to shade 7. Editing a tuple or a shade without re-running the numbers
 * fails here, not in an audit.
 */
import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from './ads-mantine-theme';
import { clientThemePresets, resolveClientThemePreset } from './presets';

// WCAG 2.x sRGB relative luminance — the same maths as the
// /demo-ext/theme live table.
function srgbChannel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * srgbChannel((n >> 16) & 255) +
    0.7152 * srgbChannel((n >> 8) & 255) +
    0.0722 * srgbChannel(n & 255)
  );
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe('clientThemePresets', () => {
  it('ships the six sellable presets, default first', () => {
    expect(clientThemePresets.map((p) => p.name)).toEqual([
      'default',
      'lime',
      'cyan',
      'red',
      'dark-green',
      'brown',
    ]);
  });

  it('keeps the true brand hex at index 5 and full 10-shade tuples', () => {
    for (const preset of clientThemePresets) {
      const primary = preset.theme.colors?.primary;
      expect(primary, preset.name).toHaveLength(10);
      expect(primary?.[5], preset.name).toBe(preset.brand);
    }
    // The two bright brand hues, verbatim — these exact values are the
    // point of the two presets, never regenerate them.
    expect(resolveClientThemePreset('lime')?.brand).toBe('#9EC222');
    expect(resolveClientThemePreset('cyan')?.brand).toBe('#37B2DF');
  });

  it('passes AA at primaryShade for every preset (white↔shade ≥ 4.5:1)', () => {
    for (const preset of clientThemePresets) {
      const primary = preset.theme.colors?.primary;
      const shadeHex = primary?.[preset.primaryShade] as string;
      expect(preset.theme.primaryShade, preset.name).toBe(preset.primaryShade);
      expect(
        contrast('#FFFFFF', shadeHex),
        `${preset.name}: white↔${shadeHex} (shade ${preset.primaryShade})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps every ramp light→dark so shade-indexed pairings hold', () => {
    for (const preset of clientThemePresets) {
      const primary = preset.theme.colors?.primary as readonly string[];
      for (let i = 0; i < 9; i++) {
        expect(
          luminance(primary[i]),
          `${preset.name}[${i}] should be lighter than [${i + 1}]`
        ).toBeGreaterThan(luminance(primary[i + 1]));
      }
    }
  });

  it('carries Saira on the lime/cyan presets only; default IS the base theme', () => {
    expect(resolveClientThemePreset('default')?.theme).toBe(adsBaseTheme);
    for (const preset of clientThemePresets) {
      if (preset.name === 'lime' || preset.name === 'cyan') {
        expect(preset.fontFamily).toMatch(/^Saira/);
        expect(preset.theme.fontFamily).toBe(preset.fontFamily);
        expect(preset.theme.headings?.fontFamily).toBe(preset.fontFamily);
      } else {
        expect(preset.fontFamily, preset.name).toBeUndefined();
        expect(preset.theme.fontFamily, preset.name).toBe(adsBaseTheme.fontFamily);
      }
    }
    expect(resolveClientThemePreset('nope')).toBeUndefined();
    expect(resolveClientThemePreset(undefined)).toBeUndefined();
  });
});
