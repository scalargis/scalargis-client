import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_THEME, mergeThemeOverrides, type MantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from './ads-mantine-theme';
import { OVERLAY_Z, POPOVER_Z } from '../onboarding/constants';

const theme = mergeThemeOverrides(DEFAULT_THEME, adsBaseTheme) as MantineTheme;

const cssTokens: Map<string, string> = (() => {
  const css = readFileSync(join(import.meta.dirname, 'ads-tokens.css'), 'utf8');
  const map = new Map<string, string>();
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) map.set(m[1], m[2].trim());
  return map;
})();

const zLadder = (adsBaseTheme.other as Record<string, Record<string, number>>).zLadder;

describe('ADS base theme', () => {
  it('runs every size token through the 16/14 scale', () => {
    expect(theme.scale).toBeCloseTo(16 / 14, 10);
    const tokens = [
      ...Object.values(theme.spacing),
      ...Object.values(theme.fontSizes),
      ...Object.values(theme.radius),
      ...Object.values(theme.headings.sizes).map((s) => s.fontSize as string),
    ];
    for (const token of tokens) {
      expect(token).toMatch(/^calc\([\d.]+rem \* var\(--mantine-scale\)\)$/);
    }
  });

  it('floats every dropdown above the dialog and below the tooltip', () => {
    const z = (name: string) => theme.components[name]?.defaultProps?.zIndex as number;
    for (const name of ['Popover', 'Menu', 'Combobox', 'HoverCard']) {
      expect(z(name), name).toBeGreaterThan(z('Modal'));
      expect(z(name), name).toBeLessThan(z('Tooltip'));
    }
  });

  it('matches the ads-tokens.css palette hex for hex', () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const colors = adsBaseTheme.colors as Record<string, readonly string[]>;
    for (const scale of ['primary', 'secondary', 'neutral', 'informative', 'success', 'warning', 'danger']) {
      steps.forEach((step, index) => {
        expect(cssTokens.get(`color-${scale}-${step}`)?.toUpperCase(), `${scale}-${step}`).toBe(
          colors[scale][index].toUpperCase()
        );
      });
    }
  });

  it('matches the ads-tokens.css z-ladder and the onboarding z-constants', () => {
    const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [rung, value] of Object.entries(zLadder)) {
      expect(Number(cssTokens.get(`z-${kebab(rung)}`)), rung).toBe(value);
    }
    expect(OVERLAY_Z).toBe(zLadder.tour);
    expect(POPOVER_Z).toBe(zLadder.tourPopover);
  });
});
