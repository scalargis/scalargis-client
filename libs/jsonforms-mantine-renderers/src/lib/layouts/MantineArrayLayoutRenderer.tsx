import {
  isObjectArrayWithNesting,
  rankWith,
  type ArrayLayoutProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react';

/**
 * Registered-but-unimplemented, mirroring the Prime lib exactly: its
 * PrimereactArrayLayoutRenderer is a registered TODO stub, so no production
 * screen can be relying on nested object arrays. Implement both sides (or
 * neither) if a consumer ever needs it — the twin pages must keep agreeing.
 */
export const MantineArrayLayoutRenderer = ({ visible }: ArrayLayoutProps) => (
  <div hidden={!visible}>TODO: MantineArrayLayoutRenderer</div>
);

export const mantineArrayLayoutTester: RankedTester = rankWith(
  4,
  isObjectArrayWithNesting
);

export default withJsonFormsArrayLayoutProps(MantineArrayLayoutRenderer);
