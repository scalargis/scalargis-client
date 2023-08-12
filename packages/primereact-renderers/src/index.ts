import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry
} from '@jsonforms/core';

import {
  PrimereactEnumArrayRenderer,
  primereactEnumArrayRendererTester,
  PrimereactEnumArraySelectRenderer,
  primereactEnumArraySelectRendererTester  
} from './complex';

import {
  PrimereactBooleanControl,
  primereactBooleanControlTester,
  PrimereactBooleanToggleControl,
  primereactBooleanToggleControlTester,  
  PrimereactDateControl,
  primereactDateControlTester,
  PrimereactDateTimeControl,
  primereactDateTimeControlTester,
  PrimereactIntegerControl,
  primereactIntegerControlTester,
  PrimereactNumberControl,
  primereactNumberControlTester,    
  PrimereactTextControl,
  primereactTextControlTester,  
  PrimereactOneOfEnumControl,
  primereactOneOfEnumControlTester,
  PrimereactRadioGroupControl,
  primereactRadioGroupControlTester
} from './controls';

import {
  PrimereactHorizontalLayout,
  primereactHorizontalLayoutTester,
  PrimereactVerticalLayout,
  primereactVerticalLayoutTester
} from './layouts';

//TODO
/*
import {
} from './cells';
*/


export * from './complex';
export * from './controls';
export * from './layouts';
//export * from './cells';
export * from './primereact-controls';
export * from './util';


export const primereactRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: primereactBooleanControlTester, renderer: PrimereactBooleanControl },
  { tester: primereactBooleanToggleControlTester, renderer: PrimereactBooleanToggleControl },
  { tester: primereactDateControlTester, renderer: PrimereactDateControl },
  { tester: primereactDateTimeControlTester, renderer: PrimereactDateTimeControl },
  { tester: primereactIntegerControlTester, renderer: PrimereactIntegerControl },
  { tester: primereactNumberControlTester, renderer: PrimereactNumberControl },
  { tester: primereactTextControlTester, renderer: PrimereactTextControl },
  { tester: primereactOneOfEnumControlTester, renderer: PrimereactOneOfEnumControl },
  { tester: primereactRadioGroupControlTester, renderer: PrimereactRadioGroupControl },
  // layouts
  { tester: primereactHorizontalLayoutTester, renderer: PrimereactHorizontalLayout },
  { tester: primereactVerticalLayoutTester, renderer: PrimereactVerticalLayout },
  // additional
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
];

export const primereactLayouts = {
  PrimereactHorizontalLayout,
  primereactHorizontalLayoutTester,
  PrimereactVerticalLayout,
  primereactVerticalLayoutTester
};