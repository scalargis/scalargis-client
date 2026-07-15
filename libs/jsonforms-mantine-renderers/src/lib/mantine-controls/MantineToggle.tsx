import { memo } from 'react';
import merge from 'lodash/merge';
import { Switch } from '@mantine/core';

import type { MantineCellProps } from '../util/field';

/** Boolean with `options.toggle` — the InputSwitch twin. Label beside the
 *  control, like MantineCheckbox. */
export const MantineToggle = memo(function MantineToggle(props: MantineCellProps) {
  const {
    data,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    config,
    label,
    description,
    error,
    withAsterisk,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <Switch
      className={className}
      id={id}
      label={withAsterisk ? <>{label} *</> : label}
      description={description}
      error={error}
      checked={!!data}
      onChange={(ev) => handleChange(path, ev.currentTarget.checked)}
      disabled={!enabled}
      autoFocus={!!appliedUiSchemaOptions.focus}
      aria-required={props['aria-required']}
    />
  );
});
