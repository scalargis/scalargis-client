import { memo } from 'react';
import { Group, Input, Slider, Text } from '@mantine/core';

import type { MantineCellProps } from '../util/field';

/**
 * Slider is not Input-shelled, so the field chrome (label, description,
 * error, asterisk) comes from Input.Wrapper and the thumb carries the
 * accessible name itself.
 */
export const MantineSlider = memo(function MantineSlider(props: MantineCellProps) {
  const {
    data,
    className,
    id,
    enabled,
    schema,
    path,
    handleChange,
    label,
    description,
    error,
    withAsterisk,
  } = props;

  const min = schema.minimum;
  const max = schema.maximum;

  return (
    <Input.Wrapper
      className={className}
      id={id}
      label={label}
      description={description}
      error={error}
      withAsterisk={withAsterisk}
    >
      <Group gap="xs" justify="space-between">
        <Text size="sm" c="dimmed">
          {min}
        </Text>
        <Text size="sm" c="dimmed">
          {max}
        </Text>
      </Group>
      <Slider
        min={min}
        max={max}
        step={schema.multipleOf || 1}
        value={
          typeof data === 'number'
            ? data
            : ((schema.default as number | undefined) ?? min ?? 0)
        }
        onChange={(value) => handleChange(path, value)}
        disabled={!enabled}
        // The thumb is the focusable element; thumbLabel is Mantine's hook
        // for its accessible name (Input.Wrapper's label targets no input).
        thumbLabel={typeof label === 'string' ? label : undefined}
        mb="xs"
      />
    </Input.Wrapper>
  );
});
