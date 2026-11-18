import React from 'react';
import { Group, Input, NumberInput } from '@mantine/core';
import { and, isControl, rankWith, schemaMatches } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

const LABELS = {
  2: ['X', 'Y'],
  4: ['Mín. X', 'Mín. Y', 'Máx. X', 'Máx. Y']
};

/** Shows a number list of fixed length as one labelled input per item. */
const FixedNumberListControl = (props) => {
  const { data, path, handleChange, label, description, errors, enabled, schema, uischema, visible, id, required } = props;
  if (!visible) return null;

  const size = schema.minItems;
  const labels = uischema?.options?.itemLabels || LABELS[size] || Array.from({ length: size }, (_, i) => String(i + 1));
  const values = Array.isArray(data) ? data : [];

  const onItem = (index, value) => {
    const next = Array.from({ length: size }, (_, i) => values[i]);
    next[index] = typeof value === 'number' ? value : undefined;
    handleChange(path, next.every((v) => v === undefined) ? undefined : next);
  };

  return (
    <Input.Wrapper id={id} label={label} description={description} error={errors || undefined} withAsterisk={required}>
      <Group grow gap="xs" mt={4} wrap="nowrap">
        {labels.map((itemLabel, index) => (
          <NumberInput
            key={index}
            label={itemLabel}
            size="xs"
            value={values[index] ?? ''}
            onChange={(value) => onItem(index, value)}
            disabled={!enabled}
            hideControls
            decimalScale={10}
            data-testid={`fixed-number-${index}`}
          />
        ))}
      </Group>
    </Input.Wrapper>
  );
};

export const fixedNumberListControlTester = rankWith(
  5,
  and(
    isControl,
    schemaMatches((schema) => schema?.type === 'array'
      && schema.items?.type === 'number'
      && Number.isInteger(schema.minItems)
      && schema.minItems === schema.maxItems
      && schema.minItems >= 2
      && schema.minItems <= 4)
  )
);

export default withJsonFormsControlProps(FixedNumberListControl);
