import { mantineRenderers } from '@scalargis/jsonforms-mantine-renderers';

import {
  ArrayPhotoControlRenderer,
  arrayPhotoControlTester,
  ArrayFileControlRenderer,
  arrayFileControlTester,
} from './complex';

import {
  MantineEnumExtendedControl,
  mantineEnumExtendedControlTester,
  MantineOneOfEnumExtendedControl,
  mantineOneOfEnumExtendedControlTester,
  PhotoControl,
  photoControlTester,
  FileControl,
  fileControlTester,
  TextDisplay,
  textDisplayTester,
  HtmlDisplay,
  htmlDisplayTester
} from './controls';

// The Mantine renderer set already registers the group/vertical/horizontal/
// array layouts the Prime list appended by hand.
export const defaultRenderers = [
  ...mantineRenderers,
  // Scalargis custom renderers
  { tester: mantineEnumExtendedControlTester, renderer: MantineEnumExtendedControl },
  { tester: mantineOneOfEnumExtendedControlTester, renderer: MantineOneOfEnumExtendedControl },
  { tester: photoControlTester, renderer: PhotoControl },
  { tester: fileControlTester, renderer: FileControl },
  { tester: textDisplayTester, renderer: TextDisplay},
  { tester: htmlDisplayTester, renderer: HtmlDisplay},
  { tester: arrayPhotoControlTester, renderer: ArrayPhotoControlRenderer },
  { tester: arrayFileControlTester, renderer: ArrayFileControlRenderer }
];
