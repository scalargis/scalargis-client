import { vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { primereactLayouts, primereactRenderers } from '@scalargis/jsonforms-primereact-renderers';
import JsonForm from './JsonForm';
import { JsonFormContext } from './JsonFormContext';

import {
  ArrayPhotoControlRenderer,
  arrayPhotoControlTester,
  ArrayFileControlRenderer,
  arrayFileControlTester,  
} from './complex';

import {
  PhotoControl,
  photoControlTester,
  FileControl,
  fileControlTester  
} from './controls';

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
  { tester: photoControlTester, renderer: PhotoControl },
  { tester: fileControlTester, renderer: FileControl },
  { tester: arrayPhotoControlTester, renderer: ArrayPhotoControlRenderer },
  { tester: arrayFileControlTester, renderer: ArrayFileControlRenderer }
];

export {
  JsonForm,
  JsonFormContext,
  defaultRenderers as JsonFormDefaultRenderers
}