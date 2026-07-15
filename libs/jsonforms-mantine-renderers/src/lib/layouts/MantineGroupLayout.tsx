import { memo } from 'react';
import { Fieldset } from '@mantine/core';
import {
  rankWith,
  uiTypeIs,
  withIncreasedRank,
  type GroupLayout,
  type LayoutProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

import {
  MantineLayoutRenderer,
  type MantineLabelableLayoutRendererProps,
} from '../util/layout';

export const groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));

/** Prime rendered a titled Card; Fieldset is the Mantine equivalent with the
 *  correct form semantics (legend groups the labelled controls). */
const GroupComponent = memo(function GroupComponent({
  visible,
  enabled,
  uischema,
  label,
  ...props
}: MantineLabelableLayoutRendererProps) {
  const groupLayout = uischema as GroupLayout;

  return (
    <Fieldset legend={label || undefined} mb="xs" hidden={!visible}>
      <MantineLayoutRenderer
        {...props}
        visible={visible}
        enabled={enabled}
        elements={groupLayout.elements}
      />
    </Fieldset>
  );
});

export const MantineGroupLayoutRenderer = ({
  uischema,
  schema,
  path,
  visible,
  enabled,
  renderers,
  cells,
  direction,
  label,
}: LayoutProps) => {
  const groupLayout = uischema as GroupLayout;

  return (
    <GroupComponent
      elements={groupLayout.elements}
      schema={schema}
      path={path}
      direction={direction}
      visible={visible}
      enabled={enabled}
      uischema={uischema}
      renderers={renderers}
      cells={cells}
      label={label}
    />
  );
};

export default withJsonFormsLayoutProps(MantineGroupLayoutRenderer);

export const mantineGroupTester: RankedTester = withIncreasedRank(1, groupTester);
