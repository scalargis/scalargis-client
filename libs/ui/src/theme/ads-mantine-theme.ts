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

import {
  createTheme,
  rem,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

import {
  motionCssVariables,
  motionDurations,
  motionTransitionProps,
} from './motion';

/* ─── ROOT FONT-SIZE COMPENSATION ──────────────────────────────────
   The viewer/backoffice shells pin `html { font-size: 14px }` (viewer
   apps/viewer/src/app/core/themes/default/layout.scss, loaded on every
   route via app.jsx → RGPD → ThemeSelector). Mantine expresses every
   size in rem, so without compensation the whole ADS scale renders at
   87.5%: the 8px spacing grid becomes a 7px grid and `size="md"`
   controls come out 36.75px instead of 42px.

   `scale` is Mantine's hook for exactly this: it multiplies every rem()
   value via --mantine-scale. Raising html to 16px instead would reflow
   every unmigrated Prime screen, so we scale rather than move the root.

   CONSEQUENCE: every size below must go through rem(). A literal
   '1rem' string is emitted verbatim and silently escapes the scale.
   Absolute px (shadow offsets) and em (breakpoints, which resolve
   against the initial 16px font-size, not html's) are unaffected.
   ------------------------------------------------------------------ */
const ROOT_FONT_SIZE = 14;
const ADS_BASE_FONT_SIZE = 16;

/* ─── PALETTES (ADS 50→900 == Mantine tuple index 0→9) ─────────────── */

// BRANDABLE — a client theme may override these two only.
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
  scale: ADS_BASE_FONT_SIZE / ROOT_FONT_SIZE,

  /* ─── COLOUR ────────────────────────────────────────────────────── */
  // Mantine derives --mantine-color-text from `black` and --mantine-color-body
  // from `white`. Left unset they default to #000/#fff; ADS body text is
  // neutral-900 (12.4:1 on white, kit 02 §text on white), never pure black.
  // `black` is also what autoContrast puts on light fills — so this is the
  // colour that lands on warning-500 (8.1:1, the pairing the kit verified).
  black: '#2B363C', // neutral-900
  white: '#FFFFFF',
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
    xs: rem(11), // GIS map/toolbar chrome ONLY (not ADS body)
    sm: rem(14), // ADS "s"
    md: rem(16), // ADS "m" (base)
    lg: rem(20), // ADS "l"
    xl: rem(24), // ADS "xl"
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
      h1: { fontSize: rem(40), lineHeight: '1.5',    fontWeight: '700' }, // 3xl
      h2: { fontSize: rem(32), lineHeight: '1.5',    fontWeight: '700' }, // 2xl
      h3: { fontSize: rem(24), lineHeight: '1.5',    fontWeight: '600' }, // xl
      h4: { fontSize: rem(20), lineHeight: '1.6',    fontWeight: '600' }, // l
      h5: { fontSize: rem(16), lineHeight: '1.75',   fontWeight: '600' }, // m
      h6: { fontSize: rem(14), lineHeight: '1.7143', fontWeight: '600' }, // s
    },
  },

  /* ─── SPACING (8px grid) ────────────────────────────────────────── */
  spacing: {
    xs: rem(8),
    sm: rem(16),
    md: rem(24),
    lg: rem(32),
    xl: rem(48),
  },

  /* ─── RADIUS ────────────────────────────────────────────────────── */
  radius: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
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
    /* ~42px control-height baseline (kit 03 §6). This must cover EVERY
       control that renders an Input shell, not just the common few —
       any component left out silently falls back to Mantine's `sm` and
       renders visibly shorter than the field next to it. */
    ...Object.fromEntries(
      [
        'Button',
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
        'ColorInput',
        'InputBase',
        // @mantine/dates — same Input shell, same baseline.
        'DateInput',
        'DatePickerInput',
        'DateTimePicker',
        'TimeInput',
        'MonthPickerInput',
        'YearPickerInput',
      ].map((name) => [name, { defaultProps: { size: 'md' } }])
    ),

    // Standalone <Input.Label> (section headers) has no wrapper to size it, so
    // match the md field labels; labels inside an input take the wrapper size.
    InputLabel: { defaultProps: { size: 'md' } },

    // Don't signal links by colour alone (WCAG 1.4.1).
    Anchor: { defaultProps: { underline: 'always' } },
    // Bigger hit area for icon-only controls. Callers MUST pass aria-label.
    ActionIcon: { defaultProps: { size: 'lg' } },

    /* ─── MOTION (see theme/motion.ts — THE central control) ────────
       Every overlay's enter/exit transition is stated here, off the
       motion tokens, so no call site ever hardcodes a duration. Mantine
       would animate most of these by default anyway; making them
       explicit is what puts them under the one switch. */
    Collapse: {
      defaultProps: { transitionDuration: motionDurations.normal },
    },

    /* ─── ADS z-index ladder (kit 03 §8) ───────────────────────────
       Mantine's own defaults (popover 300, modal 200) sit far below the
       ladder and would render under app chrome — and, during the
       coexistence window, under Prime's own overlays (~1100). */
    Modal: {
      defaultProps: {
        zIndex: 6000,
        // Prime's Dialog is viewport-centred; Mantine's Modal is top-anchored.
        centered: true,
        // Scale-in like Prime's Dialog (Mantine default is fade-down).
        transitionProps: motionTransitionProps.dialog,
      },
    },
    Drawer: {
      defaultProps: {
        zIndex: 5000,
        transitionProps: motionTransitionProps.drawer,
      },
    },
    Tooltip: {
      defaultProps: {
        zIndex: 8000,
        transitionProps: motionTransitionProps.tooltip,
      },
    },
    /* Transient dropdown overlays (Popover/Menu/Combobox/Select/HoverCard)
       ride ABOVE the dialog rung, not on the ADS --z-dropdown token (1000).
       Reason: Mantine portals these to document.body, so a Select opened
       INSIDE a Modal (6000) or Drawer (5000) would otherwise paint behind it
       and read as an empty dropdown. They float above their spawning surface
       and below toast (7000)/tooltip (8000) — which is exactly the ordering
       Mantine ships by default (popover 300 > modal 200); the flat ADS ladder
       inverted it. The 1000 --z-dropdown token stays for page-level CSS chrome
       that is never spawned inside a dialog. */
    // floatingStrategy: 'fixed' for the same reason as Combobox below — a Menu
    // (F2 mounts one in the topbar) or Popover on the default 'absolute' strategy
    // positions in document coordinates and, on the frame before floating-ui
    // measures it, extends the document: scrollbars appear, the map reflows.
    Popover: {
      defaultProps: {
        zIndex: 6100,
        floatingStrategy: 'fixed',
        transitionProps: motionTransitionProps.dropdown,
      },
    },
    Menu: {
      defaultProps: {
        zIndex: 6100,
        floatingStrategy: 'fixed',
        transitionProps: motionTransitionProps.menu,
      },
    },
    /* Popover's centred `bottom` default makes x depend on the panel's own
       width, which Combobox measures as 0 while the dropdown is display:none —
       hence bottom-start. Where it opens is then floating-ui's call: `flip`
       sends it upward when the control is near the bottom edge (the footer CRS
       select), `shift` keeps it inside the viewport.

       `floatingStrategy: 'fixed'` is what stops the flicker. Under the default
       'absolute' strategy the dropdown is portaled to <body> and positioned in
       document coordinates, so on the frame before floating-ui measures it, it
       EXTENDS the document: the viewport grows scrollbars, the map reflows, and
       the whole viewer shudders before the dropdown lands. Positioned fixed it
       is laid out against the viewport and can never grow the document. */
    Combobox: {
      defaultProps: {
        zIndex: 6100,
        position: 'bottom-start',
        floatingStrategy: 'fixed',
        middlewares: { flip: true, shift: true },
        /* THE GATE for the "dropdown flips side after painting" flicker.
           Combobox is the ONE overlay Mantine ships with transitionProps
           duration 0 (Popover/Menu default to fade/150). At duration 0 the
           Transition drops display:none in the SAME commit the panel is still
           measured 0×0, so floating-ui has no height to flip and places it
           below — and the browser paints that frame before autoUpdate's
           ResizeObserver sees the real height and jumps it up. A duration > 0
           keeps the panel display:none for the first commit and brings it back
           at opacity:0 ('pre-entering'); it gains height, gets remeasured and
           repositioned INSIDE that invisible window, so it is never seen
           mispositioned. Do NOT "optimise" this back to 0 — the jump returns.
           (respectReducedMotion is false, so this holds for every user.)
           The 120 is motionDurations.fast — same value, now sourced from the
           central tokens; motion.ts documents why it must stay > 0 even when
           motion is switched off (the kill is CSS-side). */
        transitionProps: { transition: 'fade', duration: motionDurations.fast },
      },
    },
    HoverCard: {
      defaultProps: {
        zIndex: 6100,
        transitionProps: motionTransitionProps.dropdown,
      },
    },
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
      tour: 9000,
    },
    // Easing via the central motion token, not a literal — single-sourced
    // with --transition-easing so hover/chevrons can't diverge (R5).
    transition: `all ${motionDurations.normal}ms var(--sg-motion-ease)`,
  },
});

export type AdsBaseTheme = typeof adsBaseTheme;

/* ─── SEMANTIC CSS VARIABLES ────────────────────────────────────────
   A few Mantine semantic colours are derived from its built-in `gray`
   scale at indices the ADS pairing table rejects. Aliasing gray→neutral
   (above) fixes the hue but not the index, so correct them here — this
   is the supported hook, and it keeps the fix in one place instead of
   in a `c=` prop on every call site.

   Passed to <MantineProvider cssVariablesResolver={...}> in AdsProviders.
   ------------------------------------------------------------------ */
export const adsCssVariablesResolver: CSSVariablesResolver = () => ({
  // Motion tokens (theme/motion.ts) surfaced to hand-written CSS: the shell
  // sass and the component stylesheets transition on var(--sg-motion-*), so
  // one TS module stays the single source of truth for every duration.
  // Emitted per-provider but theme-independent — identical for all client
  // themes, which is what keeps motion consistent across the six presets.
  variables: { ...motionCssVariables },
  light: {
    // Mantine default: gray-6 (#8893AA) = 3.1:1 on white. The kit rates that
    // "AA large/UI only — never body text" (02 §verified pairings), yet it is
    // what every <Text c="dimmed"> renders. neutral-7 (#64718B) = 4.9:1.
    '--mantine-color-dimmed': 'var(--mantine-color-neutral-7)',
    // ADS --color-border-strong (neutral-300). Decorative framing: it is the
    // label + focus ring that carry perceivable information, not the border.
    '--mantine-color-default-border': 'var(--mantine-color-neutral-3)',
  },
  // ADS is a light-only system; AdsProviders forces the light scheme.
  dark: {},
});
