
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_THEME, mergeThemeOverrides, type MantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { adsBaseTheme, adsCssVariablesResolver } from './ads-mantine-theme';
import { OVERLAY_Z, POPOVER_Z } from '../onboarding/constants';
import {
  motionCssVariables,
  motionDurations,
  motionEasing,
  motionTransitionProps,
} from './motion';

const theme = mergeThemeOverrides(DEFAULT_THEME, adsBaseTheme) as MantineTheme;

const ROOT_FONT_SIZE = 14;
function resolvePx(token: string): number {
  const match = /calc\(([\d.]+)rem \* var\(--mantine-scale\)\)/.exec(token);
  if (!match) throw new Error(`"${token}" is not a scaled rem token`);
  return Number(match[1]) * ROOT_FONT_SIZE * theme.scale;
}

describe('root font-size compensation', () => {
  it('scales rem tokens back to the ADS 16px base', () => {
    expect(theme.scale).toBeCloseTo(16 / 14, 10);
  });

  it('keeps spacing on the ADS 8px grid despite html{font-size:14px}', () => {
    expect(resolvePx(theme.spacing.xs)).toBeCloseTo(8);
    expect(resolvePx(theme.spacing.sm)).toBeCloseTo(16);
    expect(resolvePx(theme.spacing.md)).toBeCloseTo(24);
    expect(resolvePx(theme.spacing.lg)).toBeCloseTo(32);
    expect(resolvePx(theme.spacing.xl)).toBeCloseTo(48);
  });

  it('renders the ADS type scale at its stated pixel sizes', () => {
    expect(resolvePx(theme.fontSizes.xs)).toBeCloseTo(11);
    expect(resolvePx(theme.fontSizes.sm)).toBeCloseTo(14);
    expect(resolvePx(theme.fontSizes.md)).toBeCloseTo(16);
    expect(resolvePx(theme.fontSizes.lg)).toBeCloseTo(20);
    expect(resolvePx(theme.fontSizes.xl)).toBeCloseTo(24);
  });

  it('runs every heading size through the scale', () => {
    const expected = [
      ['h1', 40],
      ['h2', 32],
      ['h3', 24],
      ['h4', 20],
      ['h5', 16],
      ['h6', 14],
    ] as const;
    for (const [heading, px] of expected) {
      expect(resolvePx(theme.headings.sizes[heading].fontSize as string)).toBeCloseTo(px);
    }
  });

  it('keeps radius on the ADS fixed set', () => {
    expect(resolvePx(theme.radius.xs)).toBeCloseTo(4);
    expect(resolvePx(theme.radius.sm)).toBeCloseTo(8);
    expect(resolvePx(theme.radius.md)).toBeCloseTo(16);
    expect(resolvePx(theme.radius.lg)).toBeCloseTo(24);
    expect(resolvePx(theme.radius.xl)).toBeCloseTo(32);
  });

  it('leaves breakpoints in em — media queries resolve against the initial 16px', () => {
    expect(theme.breakpoints.xs).toBe('22.5em');
    expect(theme.breakpoints.md).toBe('48em');
    expect(theme.breakpoints.xl).toBe('80em');
  });
});

describe('colour restrictions', () => {
  it('uses ADS neutral-900 for body text, not pure black', () => {
    expect(theme.black).toBe('#2B363C');
    expect(theme.black).toBe(theme.colors.neutral[9]);
  });

  it('puts ADS main (shade 500) at the primary index', () => {
    expect(theme.primaryShade).toBe(5);
    expect(theme.colors.primary[5]).toBe('#1A65FA');
  });

  it('aliases gray onto neutral so Mantine defaults pick up ADS greys', () => {
    expect(theme.colors.gray).toEqual(theme.colors.neutral);
  });

  it('enables autoContrast so white never lands on the light warning fill', () => {
    expect(theme.autoContrast).toBe(true);
    expect(theme.colors.warning[5]).toBe('#FBCB3C');
  });
});

describe('control defaults', () => {
  const CONTROLS = [
    'TextInput',
    'Textarea',
    'NumberInput',
    'PasswordInput',
    'Select',
    'MultiSelect',
    'Autocomplete',
    'TagsInput',
    'NativeSelect',
    'JsonInput',
    'FileInput',
    'PinInput',
    'DatePickerInput',
    'DateInput',
    'DateTimePicker',
    'TimeInput',
  ] as const;

  it.each(CONTROLS)('%s shares the md control-height baseline', (name) => {
    expect(theme.components[name]?.defaultProps).toMatchObject({ size: 'md' });
  });

  it('renders standalone Input.Label at the md field-label size', () => {
    expect(theme.components.InputLabel?.defaultProps).toMatchObject({ size: 'md' });
  });
});

describe('overlay ladder', () => {
  it.each([
    ['Drawer', 5000],
    ['Modal', 6000],
    ['Tooltip', 8000],
  ])('%s sits on the ADS z-%d rung', (name, zIndex) => {
    expect(theme.components[name]?.defaultProps).toMatchObject({ zIndex });
  });

  it.each([
    ['Popover', 6100],
    ['Menu', 6100],
    ['Combobox', 6100],
    ['HoverCard', 6100],
  ])('%s floats above the dialog rung at z-%d', (name, zIndex) => {
    expect(theme.components[name]?.defaultProps).toMatchObject({ zIndex });
  });

  it('centres modals, as Prime dialogs are', () => {
    expect(theme.components.Modal?.defaultProps).toMatchObject({ centered: true });
  });

  it('anchors combobox dropdowns to the target start edge', () => {
    expect(theme.components.Combobox?.defaultProps).toMatchObject({
      position: 'bottom-start',
    });
  });

  it('positions combobox dropdowns against the viewport, flipping on demand', () => {
    expect(theme.components.Combobox?.defaultProps).toMatchObject({
      floatingStrategy: 'fixed',
      middlewares: { flip: true, shift: true },
    });
  });

  it.each(['Popover', 'Menu'])('positions %s against the viewport', (name) => {
    expect(theme.components[name]?.defaultProps).toMatchObject({
      floatingStrategy: 'fixed',
    });
  });

  it('gives combobox dropdowns a non-zero fade so they never paint unmeasured', () => {
    expect(theme.components.Combobox?.defaultProps).toMatchObject({
      transitionProps: { transition: 'fade', duration: 120 },
    });
  });
});


describe('central motion control', () => {
  it('keeps every JS duration above zero', () => {
    for (const duration of Object.values(motionDurations)) {
      expect(duration).toBeGreaterThan(0);
    }
    for (const props of Object.values(motionTransitionProps)) {
      expect(props.duration).toBeGreaterThan(0);
    }
  });

  it('drives every overlay transition from the motion tokens', () => {
    expect(theme.components.Modal?.defaultProps?.transitionProps).toEqual(
      motionTransitionProps.dialog
    );
    expect(theme.components.Drawer?.defaultProps?.transitionProps).toEqual(
      motionTransitionProps.drawer
    );
    expect(theme.components.Popover?.defaultProps?.transitionProps).toEqual(
      motionTransitionProps.dropdown
    );
    expect(theme.components.Menu?.defaultProps?.transitionProps).toEqual(
      motionTransitionProps.menu
    );
    expect(theme.components.HoverCard?.defaultProps?.transitionProps).toEqual(
      motionTransitionProps.dropdown
    );
    expect(theme.components.Tooltip?.defaultProps?.transitionProps).toEqual(
      motionTransitionProps.tooltip
    );
    expect(theme.components.Combobox?.defaultProps?.transitionProps).toEqual({
      transition: 'fade',
      duration: motionDurations.fast,
    });
    expect(theme.components.Collapse?.defaultProps?.transitionDuration).toBe(
      motionDurations.normal
    );
  });

  it('emits the tokens as --sg-motion-* CSS variables', () => {
    const resolved = adsCssVariablesResolver(theme);
    expect(resolved.variables).toMatchObject(motionCssVariables);
    expect(motionCssVariables['--sg-motion-normal']).toBe('200ms');
  });
});


const cssTokens: Map<string, string> = (() => {
  const css = readFileSync(join(import.meta.dirname, 'ads-tokens.css'), 'utf8');
  const map = new Map<string, string>();
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) map.set(m[1], m[2].trim());
  return map;
})();

const norm = (v: string) => v.trim().toUpperCase();

describe('CSS ↔ theme token sync', () => {
  const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
  const SCALES = [
    'primary',
    'secondary',
    'neutral',
    'informative',
    'success',
    'warning',
    'danger',
  ] as const;
  const colors = adsBaseTheme.colors as Record<string, readonly string[]>;

  it.each(SCALES)('%s palette matches ads-tokens.css hex-for-hex', (scale) => {
    STEPS.forEach((step, index) => {
      const cssValue = cssTokens.get(`color-${scale}-${step}`);
      expect(cssValue, `--color-${scale}-${step} present`).toBeTruthy();
      expect(norm(cssValue as string)).toBe(norm(colors[scale][index]));
    });
  });

  it('shadows match the ADS bottom-* tokens', () => {
    const shadows = adsBaseTheme.shadows as Record<string, string>;
    const pairs: Array<[string, string]> = [
      ['shadow-bottom-lower', shadows.xs],
      ['shadow-bottom-low', shadows.sm],
      ['shadow-bottom-medium', shadows.md],
      ['shadow-bottom-high', shadows.lg],
      ['shadow-bottom-higher', shadows.xl],
    ];
    for (const [token, themeValue] of pairs) {
      expect(cssTokens.get(token)).toBe(themeValue);
    }
  });

  it('z-ladder rungs match theme.other.zLadder', () => {
    const zLadder = (adsBaseTheme.other as Record<string, Record<string, number>>)
      .zLadder;
    const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [rung, value] of Object.entries(zLadder)) {
      expect(Number(cssTokens.get(`z-${kebab(rung)}`))).toBe(value);
    }
  });

  it('locks the onboarding engine z-constants to the tour rungs', () => {
    const zLadder = (adsBaseTheme.other as Record<string, Record<string, number>>)
      .zLadder;
    expect(OVERLAY_Z).toBe(zLadder.tour);
    expect(POPOVER_Z).toBe(zLadder.tourPopover);
  });

  it('single-sources the transition easing onto the motion token', () => {
    expect(cssTokens.get('transition-easing')).toContain('--sg-motion-ease');
    expect(motionCssVariables['--sg-motion-ease']).toBe(motionEasing);
  });
});
