import { describe, expect, it } from 'vitest';

import { clientThemePresets } from './presets';

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
  it('passes AA at primaryShade for every preset (white↔shade ≥ 4.5:1)', () => {
    for (const preset of clientThemePresets) {
      const shadeHex = preset.theme.colors?.primary?.[preset.primaryShade] as string;
      expect(preset.theme.primaryShade, preset.name).toBe(preset.primaryShade);
      expect(contrast('#FFFFFF', shadeHex), `${preset.name}: ${shadeHex}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
