/*
import {
  materialAllOfControlTester,
  MaterialAllOfRenderer,
  materialAnyOfControlTester,
  MaterialAnyOfRenderer,
  MaterialArrayControlRenderer,
  materialArrayControlTester,
  materialObjectControlTester,
  MaterialObjectRenderer,
  materialOneOfControlTester,
  MaterialOneOfRenderer,
  MaterialEnumArrayRenderer,
  materialEnumArrayRendererTester
} from './complex';
import {
  MaterialLabelRenderer,
  materialLabelRendererTester,
  MaterialListWithDetailRenderer,
  materialListWithDetailTester
} from './additional';
*/
import { 
/*
MaterialAnyOfStringOrEnumControl,
materialAnyOfStringOrEnumControlTester,
MaterialBooleanControl,
materialBooleanControlTester,
MaterialBooleanToggleControl,
materialBooleanToggleControlTester,
MaterialDateControl,
materialDateControlTester,
MaterialDateTimeControl,
materialDateTimeControlTester,
MaterialEnumControl,
materialEnumControlTester,
*/
PrimereactIntegerControl, primereactIntegerControlTester, 
/*
MaterialNativeControl,
materialNativeControlTester,
MaterialNumberControl,
materialNumberControlTester,
MaterialOneOfEnumControl,
materialOneOfEnumControlTester,
MaterialRadioGroupControl,
materialRadioGroupControlTester,
MaterialSliderControl,
materialSliderControlTester,
*/
PrimereactTextControl, primereactTextControlTester,
/*
MaterialOneOfRadioGroupControl,
materialOneOfRadioGroupControlTester
*/
 } from './controls';
import { 
/*
MaterialArrayLayout,
materialArrayLayoutTester,
MaterialCategorizationLayout,
materialCategorizationTester,
MaterialGroupLayout,
materialGroupTester,
*/
PrimereactHorizontalLayout, primereactHorizontalLayoutTester, PrimereactVerticalLayout, primereactVerticalLayoutTester } from './layouts';
import { 
/*
MaterialBooleanCell,
materialBooleanCellTester,
MaterialBooleanToggleCell,
materialBooleanToggleCellTester,
MaterialDateCell,
materialDateCellTester,
MaterialEnumCell,
materialEnumCellTester,
*/
PrimereactIntegerCell, primereactIntegerCellTester
/*
MaterialNumberCell,
materialNumberCellTester,
MaterialNumberFormatCell,
materialNumberFormatCellTester,
MaterialTextCell,
materialTextCellTester,
MaterialTimeCell,
materialTimeCellTester
*/
 } from './cells';
/*
import MaterialCategorizationStepperLayout, {
  materialCategorizationStepperTester
} from './layouts/MaterialCategorizationStepperLayout';
*/
/*
export * from './complex';
export * from './controls';
export * from './layouts';
*/
export * from './cells';
export * from './primereact-controls';
export * from './util';
export const primereactRenderers = [
    /*
    // controls
    {
      tester: materialArrayControlTester,
      renderer: MaterialArrayControlRenderer
    },
    */
    /*
     { tester: materialBooleanControlTester, renderer: MaterialBooleanControl },
     { tester: materialBooleanToggleControlTester, renderer: MaterialBooleanToggleControl },
     { tester: materialNativeControlTester, renderer: MaterialNativeControl },
     { tester: materialEnumControlTester, renderer: MaterialEnumControl },
     */
    { tester: primereactIntegerControlTester, renderer: PrimereactIntegerControl },
    /*
    { tester: materialNumberControlTester, renderer: MaterialNumberControl },
    */
    { tester: primereactTextControlTester, renderer: PrimereactTextControl },
    /*
    { tester: materialDateTimeControlTester, renderer: MaterialDateTimeControl },
    { tester: materialDateControlTester, renderer: MaterialDateControl },
    { tester: materialSliderControlTester, renderer: MaterialSliderControl },
    { tester: materialObjectControlTester, renderer: MaterialObjectRenderer },
    { tester: materialAllOfControlTester, renderer: MaterialAllOfRenderer },
    { tester: materialAnyOfControlTester, renderer: MaterialAnyOfRenderer },
    { tester: materialOneOfControlTester, renderer: MaterialOneOfRenderer },
    {
      tester: materialRadioGroupControlTester,
      renderer: MaterialRadioGroupControl
    },
    {
      tester: materialOneOfRadioGroupControlTester,
      renderer: MaterialOneOfRadioGroupControl
    },
    { tester: materialOneOfEnumControlTester, renderer: MaterialOneOfEnumControl },
    */
    // layouts
    /*
    { tester: materialGroupTester, renderer: MaterialGroupLayout },
    */
    {
        tester: primereactHorizontalLayoutTester,
        renderer: PrimereactHorizontalLayout
    },
    { tester: primereactVerticalLayoutTester, renderer: PrimereactVerticalLayout }
    /*
    ,
    {
      tester: materialCategorizationTester,
      renderer: MaterialCategorizationLayout
    },
    {
      tester: materialCategorizationStepperTester,
      renderer: MaterialCategorizationStepperLayout
    },
    { tester: materialArrayLayoutTester, renderer: MaterialArrayLayout },
    // additional
    { tester: materialLabelRendererTester, renderer: MaterialLabelRenderer },
    {
      tester: materialListWithDetailTester,
      renderer: MaterialListWithDetailRenderer
    },
    {
      tester: materialAnyOfStringOrEnumControlTester,
      renderer: MaterialAnyOfStringOrEnumControl
    },
    {
      tester: materialEnumArrayRendererTester,
      renderer: MaterialEnumArrayRenderer
    }
    */
];
export const primereactCells = [
    /*
    { tester: materialBooleanCellTester, cell: MaterialBooleanCell },
    { tester: materialBooleanToggleCellTester, cell: MaterialBooleanToggleCell },
    { tester: materialDateCellTester, cell: MaterialDateCell },
    { tester: materialEnumCellTester, cell: MaterialEnumCell },
    */
    { tester: primereactIntegerCellTester, cell: PrimereactIntegerCell }
    /*
    { tester: materialNumberCellTester, cell: MaterialNumberCell },
    { tester: materialNumberFormatCellTester, cell: MaterialNumberFormatCell },
    { tester: materialTextCellTester, cell: MaterialTextCell },
    { tester: materialTimeCellTester, cell: MaterialTimeCell }
    */
];
