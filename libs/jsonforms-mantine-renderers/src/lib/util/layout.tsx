import { memo, type ComponentType } from 'react';
import isEmpty from 'lodash/isEmpty';
import {
  getAjv,
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type OwnPropsOfRenderer,
  type UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import { Box, Flex, Stack } from '@mantine/core';

export interface MantineLayoutRendererProps extends OwnPropsOfRenderer {
  elements: UISchemaElement[];
  direction: 'row' | 'column';
}

export const renderLayoutElements = (
  elements: UISchemaElement[],
  schema: JsonSchema | undefined,
  path: string | undefined,
  enabled: boolean | undefined,
  direction: 'row' | 'column',
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) =>
  elements.map((child, index) => (
    // In a row every element gets an equal share and wraps on narrow
    // viewports via its flex-basis — no media query needed.
    <Box
      key={`${path}-${index}`}
      style={direction === 'row' ? { flex: '1 1 240px', minWidth: 0 } : undefined}
    >
      <JsonFormsDispatch
        uischema={child}
        schema={schema}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
    </Box>
  ));

const MantineLayoutRendererComponent = ({
  visible,
  elements,
  schema,
  path,
  enabled,
  direction,
  renderers,
  cells,
}: MantineLayoutRendererProps) => {
  if (isEmpty(elements)) {
    return null;
  }
  const children = renderLayoutElements(
    elements,
    schema,
    path,
    enabled,
    direction,
    renderers,
    cells
  );
  // Unlike the Prime lib, `visible` is honoured — a rule that hides a whole
  // layout hides it (the Prime version silently dropped the MUI <Hidden>).
  return direction === 'row' ? (
    <Flex gap="sm" wrap="wrap" align="flex-start" hidden={!visible}>
      {children}
    </Flex>
  ) : (
    <Stack gap="sm" hidden={!visible}>
      {children}
    </Stack>
  );
};

export const MantineLayoutRenderer = memo(MantineLayoutRendererComponent);

export interface MantineLabelableLayoutRendererProps
  extends MantineLayoutRendererProps {
  label?: string;
}

export interface AjvProps {
  // Matches the Prime lib's loose typing; the value comes from getAjv().
  ajv: ReturnType<typeof getAjv>;
}

export const withAjvProps = <P extends object>(
  Component: ComponentType<AjvProps & P>
) =>
  function WithAjvProps(props: P) {
    const ctx = useJsonForms();
    const ajv = getAjv({ jsonforms: { ...ctx } });

    return <Component {...props} ajv={ajv} />;
  };
