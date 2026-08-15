/* =====================================================================
   Regression locks for the ADS base theme.

   Each test below corresponds to a defect observed on /demo-ext/mantine
   (2026-07-09) whose cause was a missing line in this theme. They assert
   the restriction, not the implementation — see the adherence kit at
   references/projects/client/migration2/ads-adherence-restrictions/.
   ===================================================================== */

import { DEFAULT_THEME, mergeThemeOverrides, type MantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { adsBaseTheme, adsCssVariablesResolver } from './ads-mantine-theme';
import {
  motionCssVariables,
  motionDurations,
  motionTransitionProps,
} from './motion';

/** The theme as MantineProvider will actually see it. */
const theme = mergeThemeOverrides(DEFAULT_THEME, adsBaseTheme) as MantineTheme;

/** The px a `rem()` token resolves to, given the shells' 14px root. */
const ROOT_FONT_SIZE = 14;
function resolvePx(token: string): number {
  // rem() emits `calc(<n>rem * var(--mantine-scale))`.
  const match = /calc\(([\d.]+)rem \* var\(--mantine-scale\)\)/.exec(token);
  if (!match) throw new Error(`"${token}" is not a scaled rem token`);
  return Number(match[1]) * ROOT_FONT_SIZE * theme.scale;
}

describe('root font-size compensation', () => {
  it('scales rem tokens back to the ADS 16px base', () => {
    expect(theme.scale).toBeCloseTo(16 / 14, 10);
  });

  it('keeps spacing on the ADS 8px grid despite html{font-size:14px}', () => {
    // The bug: literal '0.5rem' escaped the scale and rendered 7px.
    expect(resolvePx(theme.spacing.xs)).toBeCloseTo(8);
    expect(resolvePx(theme.spacing.sm)).toBeCloseTo(16);
    expect(resolvePx(theme.spacing.md)).toBeCloseTo(24);
    expect(resolvePx(theme.spacing.lg)).toBeCloseTo(32);
    expect(resolvePx(theme.spacing.xl)).toBeCloseTo(48);
  });

  it('renders the ADS type scale at its stated pixel sizes', () => {
    expect(resolvePx(theme.fontSizes.xs)).toBeCloseTo(11); // GIS chrome only
    expect(resolvePx(theme.fontSizes.sm)).toBeCloseTo(14);
    expect(resolvePx(theme.fontSizes.md)).toBeCloseTo(16);
    expect(resolvePx(theme.fontSizes.lg)).toBeCloseTo(20);
    expect(resolvePx(theme.fontSizes.xl)).toBeCloseTo(24);
  });

  it('runs every heading size through the scale', () => {
    // resolvePx throws on a literal rem string, so a future '2.5rem' that
    // silently escapes --mantine-scale fails here, not in production.
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

describe('colour restrictions (kit 02)', () => {
  it('uses ADS neutral-900 for body text, not pure black', () => {
    // Mantine derives --mantine-color-text from `black`. Left unset it is
    // #000, which is what made every string read as bold.
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

describe('control defaults (kit 03 §6)', () => {
  /**
   * The bug: only six components carried size 'md', so DatePickerInput and
   * TagsInput fell back to Mantine's 'sm' and rendered visibly shorter than
   * the field beside them. Every Input-shelled control must share a baseline.
   */
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

  // Standalone <Input.Label> had no wrapper to size it and fell back to sm,
  // reading 2px short of the md field labels beside it.
  it('renders standalone Input.Label at the md field-label size', () => {
    expect(theme.components.InputLabel?.defaultProps).toMatchObject({ size: 'md' });
  });
});

describe('overlay ladder (kit 03 §8)', () => {
  it.each([
    ['Drawer', 5000],
    ['Modal', 6000],
    ['Tooltip', 8000],
  ])('%s sits on the ADS z-%d rung', (name, zIndex) => {
    expect(theme.components[name]?.defaultProps).toMatchObject({ zIndex });
  });

  // Transient dropdown overlays ride above the dialog rung (not the 1000
  // --z-dropdown token): Mantine portals them to body, so a Select inside a
  // Modal (6000) must clear it or it paints behind and reads as empty. Still
  // below toast (7000)/tooltip (8000).
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

  // Popover's centred `bottom` default makes the panel's x depend on its own
  // width, which Combobox measures as 0 while the dropdown is display:none —
  // so it paints half a field to the right before snapping into place.
  it('anchors combobox dropdowns to the target start edge', () => {
    expect(theme.components.Combobox?.defaultProps).toMatchObject({
      position: 'bottom-start',
    });
  });

  // Under the default 'absolute' strategy the portaled dropdown is positioned
  // in document coordinates, so for one frame it EXTENDS the document: the
  // viewport grows scrollbars and the map shudders before floating-ui lands it.
  // Fixed positioning cannot grow the document; flip/shift then choose the side
  // by the space available, which is what the footer CRS select needs.
  it('positions combobox dropdowns against the viewport, flipping on demand', () => {
    expect(theme.components.Combobox?.defaultProps).toMatchObject({
      floatingStrategy: 'fixed',
      middlewares: { flip: true, shift: true },
    });
  });

  // Popover and Menu default to 'absolute'; on that strategy a topbar Menu (F2)
  // positions in document coordinates and extends the document for one frame.
  it.each(['Popover', 'Menu'])('positions %s against the viewport', (name) => {
    expect(theme.components[name]?.defaultProps).toMatchObject({
      floatingStrategy: 'fixed',
    });
  });

  // Combobox is the one overlay Mantine ships with duration 0, which lets the
  // panel paint at 0×0 before floating-ui measures it (the "flips side after
  // painting" flicker). A non-zero fade keeps it display:none until positioned.
  it('gives combobox dropdowns a non-zero fade so they never paint unmeasured', () => {
    expect(theme.components.Combobox?.defaultProps).toMatchObject({
      transitionProps: { transition: 'fade', duration: 120 },
    });
  });
});

/* ─── Motion (theme/motion.ts — THE central control) ─────────────────── */

describe('central motion control', () => {
  // Reduced motion is a CSS-side kill (ads-globals.css); the JS numbers must
  // never be zeroed — the Combobox gate above positions dropdowns inside its
  // non-zero transition window. A 0 here would resurrect that mispaint.
  it('keeps every JS duration above zero', () => {
    for (const duration of Object.values(motionDurations)) {
      expect(duration).toBeGreaterThan(0);
    }
    for (const props of Object.values(motionTransitionProps)) {
      expect(props.duration).toBeGreaterThan(0);
    }
  });

  // Every overlay's transition is stated in the theme OFF the tokens, so no
  // component ships a duration of its own — the whole point of the control.
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

  // The CSS half: hand-written transitions (shell sass, ads-components.css)
  // read var(--sg-motion-*), emitted by the resolver on :root for every
  // client theme alike.
  it('emits the tokens as --sg-motion-* CSS variables', () => {
    const resolved = adsCssVariablesResolver(theme);
    expect(resolved.variables).toMatchObject(motionCssVariables);
    expect(motionCssVariables['--sg-motion-normal']).toBe('200ms');
  });
});
