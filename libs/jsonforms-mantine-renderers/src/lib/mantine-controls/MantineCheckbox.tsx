import { memo } from 'react';
import merge from 'lodash/merge';
import { Checkbox } from '@mantine/core';

import type { MantineCellProps } from '../util/field';

/**
 * Boolean checkbox. Unlike the Input-shelled cells, the label sits beside the
 * box (the Mantine/ADS idiom and the a11y-correct association) instead of the
 * Prime lib's label-above layout — a documented twin difference.
 */
export const MantineCheckbox = memo(function MantineCheckbox(
  props: MantineCellProps
) {
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
    <Checkbox
      className={className}
      id={id}
      // Checkbox has no withAsterisk slot; mark the label like the Prime lib did.
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
