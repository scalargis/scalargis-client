import { memo } from 'react';
import merge from 'lodash/merge';
import { NumberInput } from '@mantine/core';

import { pickFieldProps, type MantineCellProps } from '../util/field';
import { numberInputChangeHandler } from './MantineInputInteger';

export const MantineInputNumber = memo(function MantineInputNumber(
  props: MantineCellProps
) {
  const { data, className, id, enabled, uischema, path, handleChange, config } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <NumberInput
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={typeof data === 'number' ? data : ''}
      onChange={numberInputChangeHandler(handleChange, path)}
      disabled={!enabled}
      autoFocus={!!appliedUiSchemaOptions.focus}
      // Same envelope as the Prime cell: decimal mode, step 0.1, 10 decimals.
      step={0.1}
      decimalScale={10}
    />
  );
});
