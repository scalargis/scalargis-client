import { memo } from 'react';
import merge from 'lodash/merge';
import { DateTimePicker } from '@mantine/dates';

import { pickFieldProps, type MantineCellProps } from '../util/field';
import { fromMantineDateValue, toMantineDateValue } from '../util/datejs';

/** @mantine/dates DateTimePicker exchanges 'YYYY-MM-DD HH:mm:ss' strings. */
const PICKER_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * Default save format reproduces the Prime cell byte-for-byte: it took the
 * native datetime-local string (local wall time) and appended ':00.000Z' —
 * a literal Z with no UTC conversion. Backends already store that shape, so
 * the twin writes it too; `dateTimeSaveFormat` overrides it per uischema.
 */
const DEFAULT_SAVE_FORMAT = 'YYYY-MM-DDTHH:mm:00.000[Z]';

export const MantineInputDateTime = memo(function MantineInputDateTime(
  props: MantineCellProps
) {
  const { data, className, id, enabled, uischema, path, handleChange, config } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const displayFormat = appliedUiSchemaOptions.dateTimeFormat ?? 'DD/MM/YYYY HH:mm';
  const saveFormat = appliedUiSchemaOptions.dateTimeSaveFormat ?? DEFAULT_SAVE_FORMAT;

  return (
    <DateTimePicker
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={toMantineDateValue(data, saveFormat, PICKER_FORMAT)}
      onChange={(value) =>
        handleChange(path, fromMantineDateValue(value, saveFormat, PICKER_FORMAT))
      }
      valueFormat={displayFormat}
      disabled={!enabled}
      autoFocus={!!appliedUiSchemaOptions.focus}
      clearable
    />
  );
});
