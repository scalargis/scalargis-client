import { memo } from 'react';
import merge from 'lodash/merge';
import { NumberInput } from '@mantine/core';

import { pickFieldProps, type MantineCellProps } from '../util/field';

/** Commit numbers; '' clears; partial typing ('-', '1e') commits nothing. */
export const numberInputChangeHandler =
  (handleChange: (path: string, value: unknown) => void, path: string) =>
  (value: number | string) => {
    if (value === '' || value === null) {
      handleChange(path, undefined);
      return;
    }
    if (typeof value === 'number') {
      handleChange(path, value);
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      handleChange(path, parsed);
    }
  };

export const MantineInputInteger = memo(function MantineInputInteger(
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
      allowDecimal={false}
      // Prime's InputNumber grouped thousands unless formatNumber === false.
      thousandSeparator={appliedUiSchemaOptions.formatNumber === false ? undefined : ' '}
      step={1}
    />
  );
});
