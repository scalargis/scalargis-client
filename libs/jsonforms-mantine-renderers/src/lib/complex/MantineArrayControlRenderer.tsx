import { useMemo } from 'react';
import range from 'lodash/range';
import {
  encode,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  Paths,
  rankWith,
  type ArrayLayoutProps,
  type ControlElement,
  type RankedTester,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { ActionIcon, Alert, Button, Group, Stack, Table, Text } from '@mantine/core';

import {
  arrayTexts,
  columnTitle,
  getValidColumnProps,
  isRequiredColumn,
  useArrayItemActions,
} from '../util/array';
import './array-table.css';

/**
 * Object and primitive arrays as an editable table — one row per item, one
 * column per item property, Add below and a Delete per row.
 *
 * New in the Mantine lib (qa/phase-3.md D16): the Prime twin's array control
 * was a `TODO:` stub that was never even registered, so these arrays used to
 * render "No applicable renderer found".
 *
 * Every cell is a full `Control` dispatched at the row's path, not a cell
 * from a cells registry — `mantineCells` is empty by design, and dispatching
 * Controls reuses the whole registered widget set (text, enum, boolean,
 * date…) for free. The Control's label is what names the input for a screen
 * reader, so it is kept and hidden visually (see array-table.css); the column
 * header carries it for everyone else.
 */
export const MantineArrayControlRenderer = (props: ArrayLayoutProps) => {
  const {
    data,
    path,
    schema,
    rootSchema,
    visible,
    enabled,
    label,
    translations,
    addItem,
    removeItems,
    renderers,
    cells,
  } = props;

  const columns = useMemo(() => getValidColumnProps(schema), [schema]);
  const cellUiSchemas = useMemo(
    () =>
      columns.map(
        (prop) =>
          ({
            type: 'Control',
            scope: prop === '' ? '#' : `#/properties/${encode(prop)}`,
          } as ControlElement)
      ),
    [columns]
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
        // The viewer renders these forms in a narrow sidebar: the table
        // scrolls sideways instead of crushing its columns. A plain overflow-x
        // scroller (not Mantine's Table.ScrollContainer/ScrollArea) is width
        // 100% of the panel and keeps its own single native bar — the ScrollArea
        // still forced the Stack, and the sidebar content-root, to the table's
        // min-content and produced a SECOND stacked scrollbar (C-23).
        <div className="ads-jf-array-scroll" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table
            className="ads-jf-array-table"
            verticalSpacing="xs"
            horizontalSpacing="xs"
            style={{ minWidth: Math.max(columns.length, 1) * 160 }}
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map((prop, index) => (
                  <Table.Th key={prop || index} scope="col">
                    {prop === '' ? label : columnTitle(schema, prop)}
                    {isRequiredColumn(schema, prop) ? ' *' : ''}
                  </Table.Th>
                ))}
                <Table.Th w={44} aria-label={texts.remove} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {range(0, data).map((index) => {
                const rowPath = Paths.compose(path, String(index));
                return (
                  <Table.Tr key={rowPath}>
                    {columns.map((prop, column) => (
                      <Table.Td key={prop || column} className="ads-jf-cell">
                        <JsonFormsDispatch
                          schema={schema}
                          uischema={cellUiSchemas[column]}
                          path={rowPath}
                          enabled={enabled}
                          renderers={renderers}
                          cells={cells}
                        />
                      </Table.Td>
                    ))}
                    <Table.Td>
                      <ActionIcon
                        type="button"
                        variant="subtle"
                        color="danger"
                        disabled={!enabled}
                        title={texts.remove}
                        aria-label={`${texts.remove} ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <i className="pi pi-trash" aria-hidden="true" />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <Group justify="flex-end">
        <Button
          type="button"
          size="xs"
          variant="light"
          disabled={!enabled}
          leftSection={<i className="pi pi-plus" aria-hidden="true" />}
          onClick={add}
        >
          {texts.add}
        </Button>
      </Group>
    </Stack>
  );
};

export const mantineArrayControlTester: RankedTester = rankWith(
  3,
  or(isObjectArrayControl, isPrimitiveArrayControl)
);

// withArrayTranslationProps is what fills props.translations (the add/remove/
// no-data/delete-dialog strings); it needs the `t` withTranslateProps injects.
export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(MantineArrayControlRenderer))
);
