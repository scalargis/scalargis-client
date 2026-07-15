import { memo } from 'react';
import merge from 'lodash/merge';
import { DateInput } from '@mantine/dates';

import { pickFieldProps, type MantineCellProps } from '../util/field';
import { fromMantineDateValue, toMantineDateValue } from '../util/datejs';

/** @mantine/dates DateInput exchanges 'YYYY-MM-DD' strings (Mantine 8+). */
const PICKER_FORMAT = 'YYYY-MM-DD';

export const MantineInputDate = memo(function MantineInputDate(
  props: MantineCellProps
) {
  const { data, className, id, enabled, uischema, path, handleChange, config } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  // Same uischema options as the Prime control declared (dateFormat /
  // dateSaveFormat) — now actually honoured; the Prime cell was a native
  // <input type=date> that ignored both. Display defaults to the pt
  // convention the native control showed on our deployments.
  const displayFormat = appliedUiSchemaOptions.dateFormat ?? 'DD/MM/YYYY';
  const saveFormat = appliedUiSchemaOptions.dateSaveFormat ?? 'YYYY-MM-DD';

  return (
    <DateInput
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
