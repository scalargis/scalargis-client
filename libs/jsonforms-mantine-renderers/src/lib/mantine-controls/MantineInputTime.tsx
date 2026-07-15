import { memo } from 'react';
import merge from 'lodash/merge';
import { TimeInput } from '@mantine/dates';

import { pickFieldProps, type MantineCellProps } from '../util/field';

/** Prime parity: the native time input yields 'HH:mm'; stored values carry
 *  seconds ('HH:mm:ss'). */
const appendSecondsIfNecessary = (value: string): string | undefined => {
  if (value === '') return undefined;
  const parts = value.split(':');
  if (parts.length === 2) parts.push('00');
  return parts.join(':');
};

export const MantineInputTime = memo(function MantineInputTime(
  props: MantineCellProps
) {
  const { data, className, id, enabled, uischema, path, handleChange, config } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <TimeInput
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={typeof data === 'string' ? data : ''}
      onChange={(ev) =>
        handleChange(path, appendSecondsIfNecessary(ev.currentTarget.value))
      }
      disabled={!enabled}
      autoFocus={!!appliedUiSchemaOptions.focus}
    />
  );
});
