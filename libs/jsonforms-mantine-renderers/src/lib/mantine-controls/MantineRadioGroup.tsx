import { memo } from 'react';
import { Radio, Stack } from '@mantine/core';

import { pickFieldProps } from '../util/field';
import { useEnumOptionMapping, type MantineEnumCellProps } from './MantineSelect';

export const MantineRadioGroup = memo(function MantineRadioGroup(
  props: MantineEnumCellProps
) {
  const { data, className, id, enabled, path, handleChange, options } = props;
  const [radioData, byKey] = useEnumOptionMapping(options);

  return (
    <Radio.Group
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={data !== undefined && data !== null ? String(data) : null}
      onChange={(value) => handleChange(path, byKey.get(value))}
    >
      <Stack gap={4} mt={4}>
        {radioData.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            label={option.label}
            disabled={!enabled}
          />
        ))}
      </Stack>
    </Radio.Group>
  );
});
