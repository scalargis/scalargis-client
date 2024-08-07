import { vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { primereactLayouts, primereactRenderers } from '@scalargis/jsonforms-primereact-renderers';
import JsonForm from './JsonForm';
import { JsonFormContext } from './JsonFormContext';
import FormErrors from './FormErrors';

import {
  ArrayPhotoControlRenderer,
  arrayPhotoControlTester,
  ArrayFileControlRenderer,
  arrayFileControlTester,  
} from './complex';

import {
  PrimereactEnumExtendedControl,
  primereactEnumExtendedControlTester,
  PrimereactOneOfEnumExtendedControl,
  primereactOneOfEnumExtendedControlTester,
  PhotoControl,
  photoControlTester,
  FileControl,
  fileControlTester,
  TextDisplay,
  textDisplayTester,
  HtmlDisplay,
  htmlDisplayTester
} from './controls';

import {
  ValidationMode
} from './util/enums';

import { useFigTreeEvaluator } from  './useFigTreeEvaluator';

const {  
  primereactGroupTester, PrimereactGroupLayout,
  primereactVerticalLayoutTester, PrimereactVerticalLayout,
  primereactHorizontalLayoutTester, PrimereactHorizontalLayout,
  primereactArrayLayoutTester, PrimereactArrayLayout
} = primereactLayouts;

const defaultRenderers = [
  //...vanillaRenderers,
  //register primereact renderers
  ...primereactRenderers,
  { tester: primereactGroupTester, renderer: PrimereactGroupLayout },
  { tester: primereactVerticalLayoutTester, renderer: PrimereactVerticalLayout },
  { tester: primereactHorizontalLayoutTester, renderer: PrimereactHorizontalLayout },
  { tester: primereactArrayLayoutTester, renderer: PrimereactArrayLayout },
  // Scalargis custom renderers
  { tester: primereactEnumExtendedControlTester, renderer: PrimereactEnumExtendedControl },
  { tester: primereactOneOfEnumExtendedControlTester, renderer: PrimereactOneOfEnumExtendedControl },
  { tester: photoControlTester, renderer: PhotoControl },
  { tester: fileControlTester, renderer: FileControl },
  { tester: textDisplayTester, renderer: TextDisplay},
  { tester: htmlDisplayTester, renderer: HtmlDisplay},
  { tester: arrayPhotoControlTester, renderer: ArrayPhotoControlRenderer },
  { tester: arrayFileControlTester, renderer: ArrayFileControlRenderer }
];

export {
  JsonForm,
  JsonFormContext,
  defaultRenderers as JsonFormDefaultRenderers,
  FormErrors,
  useFigTreeEvaluator,
  ValidationMode
}