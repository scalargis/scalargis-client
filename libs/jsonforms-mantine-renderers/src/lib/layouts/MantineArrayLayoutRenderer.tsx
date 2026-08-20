import { useMemo, useState } from 'react';
import range from 'lodash/range';
import get from 'lodash/get';
import {
  findUISchema,
  isObjectArrayWithNesting,
  Paths,
  rankWith,
  type ArrayLayoutProps,
  type ControlElement,
  type RankedTester,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { Accordion, ActionIcon, Alert, Button, Group, Stack, Text } from '@mantine/core';
import { IconTrash, IconPlus } from '@scalargis/ui';

import {
  arrayTexts,
  getFirstPrimitiveProp,
  useArrayItemActions,
} from '../util/array';

/**
 * Object arrays that cannot be flattened into a table — items with nested
 * objects/arrays, or a `options.detail` uischema of their own. One accordion
 * panel per item, holding the item's detail form.
 *
 * Implemented in the Mantine lib (qa/phase-3.md D17); the Prime twin left a
 * registered `TODO: PrimereactArrayLayoutRenderer` stub showing through to
 * the user, and this file was its faithful copy until now.
 */
export const MantineArrayLayoutRenderer = (props: ArrayLayoutProps) => {
  const {
    data,
    path,
    schema,
    rootSchema,
    uischema,
    uischemas,
    visible,
    enabled,
    label,
    translations,
    addItem,
    removeItems,
    renderers,
    cells,
  } = props;

  const ctx = useJsonForms();
  const rootData = ctx.core?.data;

  const [expanded, setExpanded] = useState<string | null>(null);

  // Honours `options.detail` (the shape the demo2 fixture uses) and falls
  // back to a generated vertical layout over the item's properties.
  const detailUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        'VerticalLayout',
        uischema as ControlElement,
        rootSchema
      ),
    [uischemas, schema, uischema, path, rootSchema]
  );

  const labelProp = useMemo(
    () =>
      (uischema.options?.['elementLabelProp'] as string | undefined) ??
      getFirstPrimitiveProp(schema),
    [uischema, schema]
  );

  const { add, remove } = useArrayItemActions({
    path,
    schema,
    rootSchema,
    addItem,
    removeItems,
    translations,
  });
  const texts = arrayTexts(translations);

  const itemLabel = (index: number): string => {
    const item = get(rootData, Paths.compose(path, String(index)));
    const value = labelProp ? get(item, labelProp) : undefined;
    return value !== undefined && value !== null && value !== ''
      ? String(value)
      : `${label || 'Item'} ${index + 1}`;
  };

  return (
    <Stack gap="xs" hidden={!visible}>
      {label ? (
        <Text component="span" fw={500} size="sm">
          {label}
        </Text>
      ) : null}

      {data === 0 ? (
        <Alert color="informative" py="xs">
          {texts.noData}
        </Alert>
      ) : (
        <Accordion
          variant="contained"
          value={expanded}
          onChange={setExpanded}
          chevronPosition="left"
        >
          {range(0, data).map((index) => {
            const rowPath = Paths.compose(path, String(index));
            return (
              <Accordion.Item key={rowPath} value={rowPath}>
                <Group gap={0} wrap="nowrap" pr="xs">
                  <Accordion.Control>{itemLabel(index)}</Accordion.Control>
                  <ActionIcon
                    type="button"
                    variant="subtle"
                    color="danger"
                    disabled={!enabled}
                    title={texts.remove}
                    aria-label={`${texts.remove} ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <IconTrash />
                  </ActionIcon>
                </Group>
                <Accordion.Panel>
                  <JsonFormsDispatch
                    schema={schema}
                    uischema={detailUiSchema}
                    path={rowPath}
                    enabled={enabled}
                    renderers={renderers}
                    cells={cells}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      <Group justify="flex-end">
        <Button
          type="button"
          size="xs"
          variant="light"
          disabled={!enabled}
          leftSection={<IconPlus />}
          onClick={() => {
            add();
            // The item just appended is the one the user wants to fill in.
            setExpanded(Paths.compose(path, String(data)));
          }}
        >
          {texts.add}
        </Button>
      </Group>
    </Stack>
  );
};

export const mantineArrayLayoutTester: RankedTester = rankWith(
  4,
  isObjectArrayWithNesting
);

export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(MantineArrayLayoutRenderer))
);
