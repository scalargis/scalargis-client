import { useMemo, useState } from 'react';
import merge from 'lodash/merge';
import { Button, Group, Stepper } from '@mantine/core';
import {
  and,
  categorizationHasCategory,
  deriveLabelForUISchemaElement,
  isVisible,
  optionIs,
  rankWith,
  uiTypeIs,
  type Categorization,
  type Category,
  type RankedTester,
  type StatePropsOfLayout,
} from '@jsonforms/core';
import {
  withJsonFormsLayoutProps,
  withTranslateProps,
  type TranslateProps,
} from '@jsonforms/react';

import {
  MantineLayoutRenderer,
  withAjvProps,
  type AjvProps,
  type MantineLayoutRendererProps,
} from '../util/layout';
import { translateDefault } from '../util/i18nDefaults';

/** Same rule as the Prime renderer: steps are only non-clickable when nav
 *  buttons exist to advance instead. */
const isStepperReadOnly = (uiSchemaOptions: Record<string, unknown>): boolean =>
  !uiSchemaOptions['showNavButtons'] ? false : !!uiSchemaOptions['stepperReadOnly'];

export const mantineCategorizationStepperTester: RankedTester = rankWith(
  2,
  and(
    uiTypeIs('Categorization'),
    categorizationHasCategory,
    optionIs('variant', 'stepper')
  )
);

export interface MantineCategorizationStepperLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  data: unknown;
}

export const MantineCategorizationStepperLayoutRenderer = (
  props: MantineCategorizationStepperLayoutRendererProps
) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const {
    data,
    path,
    renderers,
    schema,
    uischema,
    visible,
    cells,
    config,
    enabled,
    ajv,
    t,
    locale,
  } = props;

  const categorization = uischema as Categorization;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const categories = useMemo(
    () =>
      (categorization?.elements || []).filter((category) =>
        isVisible(category, data, '', ajv, undefined)
      ),
    [categorization, data, ajv]
  );

  const safeCategory = activeCategory >= categories.length ? 0 : activeCategory;

  const childProps: MantineLayoutRendererProps = {
    elements: (categories[safeCategory] as Category | undefined)?.elements ?? [],
    schema,
    path,
    direction: 'column',
    enabled,
    visible,
    renderers,
    cells,
  };

  const stepLabels = useMemo(
    () => categories.map((e) => deriveLabelForUISchemaElement(e as Category, t)),
    [categories, t]
  );

  const previousButtonLabel = useMemo(
    () => translateDefault(t, locale, 'stepper.previous', { schema, uischema, path }),
    [t, locale, schema, uischema, path]
  );
  const nextButtonLabel = useMemo(
    () => translateDefault(t, locale, 'stepper.next', { schema, uischema, path }),
    [t, locale, schema, uischema, path]
  );

  const readOnly = isStepperReadOnly(appliedUiSchemaOptions);

  return (
    <div hidden={!visible}>
      <Stepper
        active={safeCategory}
        onStepClick={readOnly ? undefined : setActiveCategory}
        mb="sm"
        size="sm"
      >
        {categories.map((_, idx) => (
          <Stepper.Step key={idx} label={stepLabels[idx]} />
        ))}
      </Stepper>
      <MantineLayoutRenderer {...childProps} key={safeCategory} />
      {appliedUiSchemaOptions.showNavButtons ? (
        <Group justify="flex-end" mt="sm">
          <Button
            variant="default"
            disabled={safeCategory <= 0}
            onClick={() => setActiveCategory(safeCategory - 1)}
          >
            {previousButtonLabel || 'Previous'}
          </Button>
          <Button
            disabled={safeCategory >= categories.length - 1}
            onClick={() => setActiveCategory(safeCategory + 1)}
          >
            {nextButtonLabel || 'Next'}
          </Button>
        </Group>
      ) : null}
    </div>
  );
};

export default withAjvProps(
  withTranslateProps(
    withJsonFormsLayoutProps(MantineCategorizationStepperLayoutRenderer)
  )
);
