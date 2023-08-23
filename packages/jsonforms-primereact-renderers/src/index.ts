import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry
} from '@jsonforms/core';

import {
  /*
  materialAllOfControlTester,
  MaterialAllOfRenderer,
  materialAnyOfControlTester,
  MaterialAnyOfRenderer,
  */
  PrimereactArrayControlRenderer,
  primereactArrayControlTester,
  /*
  materialObjectControlTester,
  MaterialObjectRenderer,
  materialOneOfControlTester,
  MaterialOneOfRenderer,
  */
  PrimereactEnumArrayRenderer,
  primereactEnumArrayRendererTester,
  PrimereactEnumArraySelectRenderer,
  primereactEnumArraySelectRendererTester  
} from './complex';


import {
  PrimereactLabelRenderer,
  primereactLabelRendererTester,
  //MaterialListWithDetailRenderer,
  //materialListWithDetailTester,
  
  PrimereactDividerRenderer,
  primereactDividerRendererTester,  
} from './additional';

import {
  PrimereactBooleanControl,
  primereactBooleanControlTester,
  PrimereactBooleanToggleControl,
  primereactBooleanToggleControlTester,  
  PrimereactDateControl,
  primereactDateControlTester,
  PrimereactDateTimeControl,
  primereactDateTimeControlTester,
  PrimereactEnumControl,
  primereactEnumControlTester,
  PrimereactIntegerControl,
  primereactIntegerControlTester,
  PrimereactNumberControl,
  primereactNumberControlTester,
  PrimereactOneOfEnumControl,
  primereactOneOfEnumControlTester,
  PrimereactOneOfRadioGroupControl,
  primereactOneOfRadioGroupControlTester,  
  PrimereactRadioGroupControl,
  primereactRadioGroupControlTester,
  PrimereactSliderControl,
  primereactSliderControlTester,
  PrimereactTextControl,
  primereactTextControlTester,
  PrimereactTimeControl,
  primereactTimeControlTester,  
} from './controls';

import {
  PrimereactArrayLayout,
  primereactArrayLayoutTester,
  PrimereactCategorizationLayout,
  primereactCategorizationTester,
  PrimereactGroupLayout,
  primereactGroupTester,
  PrimereactHorizontalLayout,
  primereactHorizontalLayoutTester,
  PrimereactVerticalLayout,
  primereactVerticalLayoutTester
} from './layouts';

//TODO
/*
import {
  MaterialBooleanCell,
  materialBooleanCellTester,
  MaterialBooleanToggleCell,
  materialBooleanToggleCellTester,
  MaterialDateCell,
  materialDateCellTester,
  MaterialEnumCell,
  materialEnumCellTester,
  MaterialIntegerCell,
  materialIntegerCellTester,
  MaterialNumberCell,
  materialNumberCellTester,
  MaterialNumberFormatCell,
  materialNumberFormatCellTester,
  MaterialOneOfEnumCell,
  materialOneOfEnumCellTester,
  MaterialTextCell,
  materialTextCellTester,
  MaterialTimeCell,
  materialTimeCellTester,
} from './cells';
*/

import PrimereactCategorizationStepperLayout, {
  primereactCategorizationStepperTester,
} from './layouts/PrimereactCategorizationStepperLayout';

export * from './additional';
//export * from './cells';
export * from './complex';
export * from './controls';
export * from './layouts';
export * from './primereact-controls';
export * from './util';

export const primereactRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  //{ tester: primereactArrayControlTester, renderer: PrimereactArrayControlRenderer },  
  { tester: primereactBooleanControlTester, renderer: PrimereactBooleanControl },
  { tester: primereactBooleanToggleControlTester, renderer: PrimereactBooleanToggleControl },
  { tester: primereactDateControlTester, renderer: PrimereactDateControl },
  { tester: primereactDateTimeControlTester, renderer: PrimereactDateTimeControl },
  { tester: primereactEnumControlTester, renderer: PrimereactEnumControl },
  { tester: primereactTimeControlTester, renderer: PrimereactTimeControl },
  { tester: primereactIntegerControlTester, renderer: PrimereactIntegerControl },
  { tester: primereactNumberControlTester, renderer: PrimereactNumberControl },
  { tester: primereactSliderControlTester, renderer: PrimereactSliderControl },
  { tester: primereactOneOfEnumControlTester, renderer: PrimereactOneOfEnumControl },
  { tester: primereactOneOfRadioGroupControlTester, renderer: PrimereactOneOfRadioGroupControl },
  { tester: primereactRadioGroupControlTester, renderer: PrimereactRadioGroupControl },
  { tester: primereactTextControlTester, renderer: PrimereactTextControl },
  // layouts
  { tester: primereactGroupTester, renderer: PrimereactGroupLayout },
  { tester: primereactHorizontalLayoutTester, renderer: PrimereactHorizontalLayout },
  { tester: primereactVerticalLayoutTester, renderer: PrimereactVerticalLayout },
  {
    tester: primereactCategorizationTester,
    renderer: PrimereactCategorizationLayout,
  },
  {
    tester: primereactCategorizationStepperTester,
    renderer: PrimereactCategorizationStepperLayout,
  },
  { tester: primereactArrayLayoutTester, renderer: PrimereactArrayLayout },
  // additional
  { tester: primereactLabelRendererTester, renderer: PrimereactLabelRenderer },
  /*
  {
    tester: materialListWithDetailTester,
    renderer: MaterialListWithDetailRenderer,
  },
  */
  { tester: primereactDividerRendererTester, renderer: PrimereactDividerRenderer },
  /*
  {
    tester: materialAnyOfStringOrEnumControlTester,
    renderer: MaterialAnyOfStringOrEnumControl,
  },
  */
  {
    tester: primereactEnumArrayRendererTester,
    renderer: PrimereactEnumArrayRenderer
  },
  {
    tester: primereactEnumArraySelectRendererTester,
    renderer: PrimereactEnumArraySelectRenderer
  }  
];

export const primereactCells: JsonFormsCellRendererRegistryEntry[] = [
  /*
  { tester: materialBooleanCellTester, cell: MaterialBooleanCell },
  { tester: materialBooleanToggleCellTester, cell: MaterialBooleanToggleCell },
  { tester: materialDateCellTester, cell: MaterialDateCell },
  { tester: materialEnumCellTester, cell: MaterialEnumCell },
  { tester: materialIntegerCellTester, cell: MaterialIntegerCell },
  { tester: materialNumberCellTester, cell: MaterialNumberCell },
  { tester: materialNumberFormatCellTester, cell: MaterialNumberFormatCell },
  { tester: materialOneOfEnumCellTester, cell: MaterialOneOfEnumCell },
  { tester: materialTextCellTester, cell: MaterialTextCell },
  { tester: materialTimeCellTester, cell: MaterialTimeCell },
  */
];

export const primereactLayouts = {
  PrimereactGroupLayout,
  primereactGroupTester,
  PrimereactCategorizationLayout,
  primereactCategorizationTester,
  PrimereactHorizontalLayout,
  primereactHorizontalLayoutTester,
  PrimereactVerticalLayout,
  primereactVerticalLayoutTester,
  PrimereactArrayLayout,
  primereactArrayLayoutTester,
};

import { UnwrappedAdditional } from './additional/unwrapped';
import { UnwrappedComplex } from './complex/unwrapped';
import { UnwrappedControls } from './controls/unwrapped';
import { UnwrappedLayouts } from './layouts/unwrapped';

export const Unwrapped = {
  ...UnwrappedAdditional,
  ...UnwrappedComplex,
  ...UnwrappedControls,
  ...UnwrappedLayouts,
};