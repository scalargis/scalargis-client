/* =====================================================================
   jsonforms-mantine-renderers — the Mantine twin of
   libs/jsonforms-primereact-renderers (migration2 plan §1d).

   Same registered renderer set, same testers, same ranks; Mantine
   widgets themed by the ADS base theme (@scalargis/ui). Behavioural
   contracts carried over from the Prime lib:

   - a control hidden by a rule CLEARS its value (MantineInputControl);
   - '' / empty selections store undefined, never '' or [];
   - descriptions show while focused (isDescriptionHidden), errors always;
   - the same i18n default keys (enum.placeholder, stepper.next, …).

   Documented improvements over the Prime lib (see the twin page
   /demo-ext/jsonforms-mantine and qa/phase-1.md):
   - `options.multi` renders a real Textarea;
   - label/error/aria wiring is native to every Mantine input;
   - layout/label/divider renderers honour `visible`.

   The Prime lib stays until its last consumer migrates (Phase 3).
   ===================================================================== */

import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';

import {
  MantineEnumArrayRenderer,
  mantineEnumArrayRendererTester,
  MantineEnumArraySelectRenderer,
  mantineEnumArraySelectRendererTester,
} from './complex';

import {
  MantineDividerRenderer,
  mantineDividerRendererTester,
  MantineLabelRenderer,
  mantineLabelRendererTester,
} from './additional';

import {
  MantineBooleanControl,
  mantineBooleanControlTester,
  MantineBooleanToggleControl,
  mantineBooleanToggleControlTester,
  MantineDateControl,
  mantineDateControlTester,
  MantineDateTimeControl,
  mantineDateTimeControlTester,
  MantineEnumControl,
  mantineEnumControlTester,
  MantineIntegerControl,
  mantineIntegerControlTester,
  MantineNumberControl,
  mantineNumberControlTester,
  MantineOneOfEnumControl,
  mantineOneOfEnumControlTester,
  MantineOneOfRadioGroupControl,
  mantineOneOfRadioGroupControlTester,
  MantineRadioGroupControl,
  mantineRadioGroupControlTester,
  MantineSliderControl,
  mantineSliderControlTester,
  MantineTextControl,
  mantineTextControlTester,
  MantineTimeControl,
  mantineTimeControlTester,
} from './controls';

import {
  MantineArrayLayout,
  mantineArrayLayoutTester,
  MantineCategorizationLayout,
  mantineCategorizationTester,
  MantineGroupLayout,
  mantineGroupTester,
  MantineHorizontalLayout,
  mantineHorizontalLayoutTester,
  MantineVerticalLayout,
  mantineVerticalLayoutTester,
} from './layouts';

import MantineCategorizationStepperLayout, {
  mantineCategorizationStepperTester,
} from './layouts/MantineCategorizationStepperLayout';

export * from './additional';
export * from './complex';
export * from './controls';
export * from './layouts';
export * from './mantine-controls';
export * from './util';

export const mantineRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: mantineBooleanControlTester, renderer: MantineBooleanControl },
  { tester: mantineBooleanToggleControlTester, renderer: MantineBooleanToggleControl },
  { tester: mantineDateControlTester, renderer: MantineDateControl },
  { tester: mantineDateTimeControlTester, renderer: MantineDateTimeControl },
  { tester: mantineEnumControlTester, renderer: MantineEnumControl },
  { tester: mantineTimeControlTester, renderer: MantineTimeControl },
  { tester: mantineIntegerControlTester, renderer: MantineIntegerControl },
  { tester: mantineNumberControlTester, renderer: MantineNumberControl },
  { tester: mantineSliderControlTester, renderer: MantineSliderControl },
  { tester: mantineOneOfEnumControlTester, renderer: MantineOneOfEnumControl },
  {
    tester: mantineOneOfRadioGroupControlTester,
    renderer: MantineOneOfRadioGroupControl,
  },
  { tester: mantineRadioGroupControlTester, renderer: MantineRadioGroupControl },
  { tester: mantineTextControlTester, renderer: MantineTextControl },
  // layouts
  { tester: mantineGroupTester, renderer: MantineGroupLayout },
  { tester: mantineHorizontalLayoutTester, renderer: MantineHorizontalLayout },
  { tester: mantineVerticalLayoutTester, renderer: MantineVerticalLayout },
  { tester: mantineCategorizationTester, renderer: MantineCategorizationLayout },
  {
    tester: mantineCategorizationStepperTester,
    renderer: MantineCategorizationStepperLayout,
  },
  { tester: mantineArrayLayoutTester, renderer: MantineArrayLayout },
  // additional
  { tester: mantineLabelRendererTester, renderer: MantineLabelRenderer },
  { tester: mantineDividerRendererTester, renderer: MantineDividerRenderer },
  { tester: mantineEnumArrayRendererTester, renderer: MantineEnumArrayRenderer },
  {
    tester: mantineEnumArraySelectRendererTester,
    renderer: MantineEnumArraySelectRenderer,
  },
];

/** Empty, like the Prime lib's primereactCells — kept for signature parity
 *  with call sites that pass `cells={...}`. */
export const mantineCells: JsonFormsCellRendererRegistryEntry[] = [];

/** Consumer parity with `primereactLayouts` (libs/components JsonForm). */
export const mantineLayouts = {
  MantineGroupLayout,
  mantineGroupTester,
  MantineCategorizationLayout,
  mantineCategorizationTester,
  MantineHorizontalLayout,
  mantineHorizontalLayoutTester,
  MantineVerticalLayout,
  mantineVerticalLayoutTester,
  MantineArrayLayout,
  mantineArrayLayoutTester,
};
