/* =====================================================================
   ADS base theme for Mantine  —  scalargis  (LIVING COPY)
   Encodes the Ágora Design System (ADS, @ama-pt/agora-design-system
   v3.5.3) restrictions into Mantine's createTheme().

   This is the "construction-norms" adherence layer (ADS Art. 2.5.6):
   ADS supplies colour / type / spacing tokens and the WCAG 2.1 AA bar;
   Mantine supplies the components. The spec this file implements lives
   in references/projects/client/migration2/ads-adherence-restrictions/
   (02 colours, 03 sizing, 04 accessibility, 05 mantine mapping) — keep
   the two in sync; the kit is the spec, this copy is what ships.

   Pairs with ads-tokens.css (raw --* custom properties) and
   ads-globals.css (magenta focus ring + reduced-motion — the parts
   Mantine's theme object cannot express).

   IMMUTABLE: neutral / informative / success / warning / danger.
   BRANDABLE (client themes only): primary + secondary — see the
   override contract in the kit's 05-mantine-mapping.md.
   ===================================================================== */

import { createTheme, type MantineColorsTuple } from '@mantine/core';

/* ─── PALETTES (ADS 50→900 == Mantine tuple index 0→9) ─────────────── */

// BRANDABLE — a client theme (snic3, mapaspt) may override these two only.
const primary: MantineColorsTuple = [
  '#FAFCFF', '#F2F6FF', '#E5EEFF', '#BBD1FD', '#5F93FC',
  '#1A65FA', '#034AD8', '#0338A2', '#002B82', '#021C51',
];

const secondary: MantineColorsTuple = [
  '#F5FBFF', '#EBF6FF', '#E3F4FF', '#CCEAFF', '#A0D8FE',
  '#1CA3FC', '#1993E3', '#1682CA', '#12669E', '#0D4C75',
];

// IMMUTABLE FOUNDATION — never override (ADS §2.5.3 / DL 49/2024).
const neutral: MantineColorsTuple = [
  '#F7F8FA', '#F1F3F8', '#E1E4EA', '#CDD2DC', '#BAC0CC',
  '#9CA6B8', '#8893AA', '#64718B', '#475164', '#2B363C',
];

const informative: MantineColorsTuple = [
  '#F0FAFF', '#E5F6FF', '#A5DEFF', '#77CEFF', '#49BCFF',
  '#0079BF', '#00598C', '#0B486B', '#083752', '#00121C',
];

const success: MantineColorsTuple = [
  '#E5FFF6', '#C2F2E2', '#7ACCB1', '#36B289', '#1F9970',
  '#008558', '#00724C', '#005539', '#013926', '#001C13',
];

const warning: MantineColorsTuple = [
  '#FFF9E5', '#FFF2CC', '#FFED99', '#FFE699', '#FFD966',
  '#FBCB3C', '#FBBB3C', '#F2A222', '#B06112', '#80460D',
];

const danger: MantineColorsTuple = [
  '#FEF1F2', '#FEE1E3', '#FEC8CC', '#FCA6AD', '#F8727D',
  '#DE2D3B', '#D12332', '#C41826', '#B20917', '#86131D',
];

export const adsBaseTheme = createTheme({
  /* ─── COLOUR ────────────────────────────────────────────────────── */
  colors: {
    primary,
    secondary,
    neutral,
    // Alias neutral onto Mantine's built-in "gray" so default component
    // greys resolve to ADS neutrals instead of Mantine's own scale.
    gray: neutral,
    informative,
    success,
    warning,
    danger,
  },
  primaryColor: 'primary',
  // ADS "main" is shade 500 → tuple index 5 (Mantine default is 6).
  primaryShade: 5,
  // Auto-pick black/white label on filled controls by luminance — this is
  // what keeps white OFF the light warning-500 fill (kit 02 §warning).
  autoContrast: true,
  luminanceThreshold: 0.3,

  /* ─── TYPOGRAPHY ────────────────────────────────────────────────── */
  fontFamily: '"Noto Sans", sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSizes: {
    xs: '0.6875rem', // 11px — GIS map/toolbar chrome ONLY (not ADS body)
    sm: '0.875rem',  // 14px — ADS "s"
    md: '1rem',      // 16px — ADS "m" (base)
    lg: '1.25rem',   // 20px — ADS "l"
    xl: '1.5rem',    // 24px — ADS "xl"
  },
  lineHeights: {
    xs: '1.45',
    sm: '1.7143', // 24/14
    md: '1.75',   // 28/16
    lg: '1.6',    // 32/20
    xl: '1.5',    // 36/24
  },
  headings: {
    fontFamily: '"Noto Sans", sans-serif',
    sizes: {
      h1: { fontSize: '2.5rem',  lineHeight: '1.5',    fontWeight: '700' }, // 3xl
      h2: { fontSize: '2rem',    lineHeight: '1.5',    fontWeight: '700' }, // 2xl
      h3: { fontSize: '1.5rem',  lineHeight: '1.5',    fontWeight: '600' }, // xl
      h4: { fontSize: '1.25rem', lineHeight: '1.6',    fontWeight: '600' }, // l
      h5: { fontSize: '1rem',    lineHeight: '1.75',   fontWeight: '600' }, // m
      h6: { fontSize: '0.875rem',lineHeight: '1.7143', fontWeight: '600' }, // s
    },
  },

  /* ─── SPACING (8px grid) ────────────────────────────────────────── */
  spacing: {
    xs: '0.5rem', // 8
    sm: '1rem',   // 16
    md: '1.5rem', // 24
    lg: '2rem',   // 32
    xl: '3rem',   // 48
  },

  /* ─── RADIUS ────────────────────────────────────────────────────── */
  radius: {
    xs: '0.25rem', // 4
    sm: '0.5rem',  // 8
    md: '1rem',    // 16
    lg: '1.5rem',  // 24
    xl: '2rem',    // 32
  },
  defaultRadius: 'sm', // 8px — ADS default for buttons/inputs/cards

  /* ─── SHADOWS (Mantine xs–xl → ADS bottom-*) ────────────────────── */
  shadows: {
    xs: '0px 4px 4px 0px rgba(0, 0, 0, 0.16)',   // bottom-lower
    sm: '0px 8px 8px 0px rgba(0, 0, 0, 0.08)',   // bottom-low
    md: '0px 16px 16px 0px rgba(0, 0, 0, 0.08)', // bottom-medium
    lg: '0px 16px 16px 0px rgba(0, 0, 0, 0.16)', // bottom-high
    xl: '0px 16px 16px 0px rgba(0, 0, 0, 0.32)', // bottom-higher
  },

  /* ─── BREAKPOINTS (only ADS xs/md/xl are sanctioned) ────────────── */
  breakpoints: {
    xs: '22.5em', // 360
    sm: '36em',   // 576 — interpolated, NOT an ADS breakpoint
    md: '48em',   // 768
    lg: '64em',   // 1024 — interpolated, NOT an ADS breakpoint
    xl: '80em',   // 1280
  },

  /* ─── ACCESSIBILITY / UX ────────────────────────────────────────── */
  // 'auto' shows a ring on keyboard focus; its COLOUR is forced to the ADS
  // magenta (#F408FC) in ads-globals.css — Mantine would use the brand hue.
  focusRing: 'auto',
  cursorType: 'pointer',

  /* ─── COMPONENT DEFAULTS (thin, pattern-level only) ─────────────── */
  components: {
    // ~42px control-height baseline on interactive controls.
    Button:      { defaultProps: { size: 'md' } },
    TextInput:   { defaultProps: { size: 'md' } },
    Textarea:    { defaultProps: { size: 'md' } },
    NumberInput: { defaultProps: { size: 'md' } },
    PasswordInput: { defaultProps: { size: 'md' } },
    Select:      { defaultProps: { size: 'md' } },
    MultiSelect: { defaultProps: { size: 'md' } },
    // Don't signal links by colour alone (WCAG 1.4.1).
    Anchor:      { defaultProps: { underline: 'always' } },
    // Bigger hit area for icon-only controls. Callers MUST pass aria-label.
    ActionIcon:  { defaultProps: { size: 'lg' } },
    // ADS z-index ladder — overlays must clear app chrome (kit 03 §8).
    Modal:   { defaultProps: { zIndex: 6000 } },
    Drawer:  { defaultProps: { zIndex: 5000 } },
    Tooltip: { defaultProps: { zIndex: 8000 } },
  },

  /* ─── ESCAPE HATCH: raw ADS tokens for hand-written CSS ─────────── */
  // Values Mantine's scales don't cover (space-56..256, top/center/inner
  // shadows, GIS z-index, sidebar width). Full set in ads-tokens.css;
  // mirrored here so they're reachable as var(--mantine-...) too.
  other: {
    adsFocus: '#F408FC',
    controlMinTouch: '44px',
    zLadder: {
      dropdown: 1000, backdrop: 2000, sticky: 3000, fixed: 4000,
      drawer: 5000, dialog: 6000, toast: 7000, tooltip: 8000,
    },
    transition: 'all 200ms ease-in-out',
  },
});

export type AdsBaseTheme = typeof adsBaseTheme;
