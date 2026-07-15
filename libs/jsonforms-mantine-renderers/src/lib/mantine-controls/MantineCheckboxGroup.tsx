import { memo } from 'react';
import { Checkbox, Stack } from '@mantine/core';

import { pickFieldProps } from '../util/field';
import { useEnumOptionMapping, type MantineEnumCellProps } from './MantineSelect';

/**
 * The enum-array checkbox list (uniqueItems arrays of enum/oneOf consts).
 * Checkbox.Group appends newly checked values at the end — the same
 * check-order semantics as the Prime cell's push/filter.
 */
export const MantineCheckboxGroup = memo(function MantineCheckboxGroup(
  props: MantineEnumCellProps
) {
  const { data, className, id, enabled, path, handleChange, options } = props;
  const [checkboxData, byKey] = useEnumOptionMapping(options);

  return (
    <Checkbox.Group
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={Array.isArray(data) ? data.map(String) : []}
      onChange={(values) =>
        // Prime parity: an empty selection stores undefined, not [].
        handleChange(
          path,
          values.length ? values.map((value) => byKey.get(value)) : undefined
        )
      }
    >
      <Stack gap={4} mt={4}>
        {checkboxData.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={option.label}
            disabled={!enabled}
          />
        ))}
      </Stack>
    </Checkbox.Group>
  );
});
