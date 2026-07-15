import { Title } from '@mantine/core';
import {
  rankWith,
  uiTypeIs,
  type LabelProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsLabelProps } from '@jsonforms/react';

export const mantineLabelRendererTester: RankedTester = rankWith(1, uiTypeIs('Label'));

/** The Prime renderer emitted an h4; Title order 4 is its themed twin. */
export const MantineLabelRenderer = ({ text, visible }: LabelProps) => (
  <Title order={4} hidden={!visible}>
    {text}
  </Title>
);

export default withJsonFormsLabelProps(MantineLabelRenderer);
