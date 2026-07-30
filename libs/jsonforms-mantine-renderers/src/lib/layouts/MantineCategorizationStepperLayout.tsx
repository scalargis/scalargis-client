import { useMemo, useState } from 'react';
import merge from 'lodash/merge';
import { Button, Group, Stepper } from '@mantine/core';
import {
  and,
  categorizationHasCategory,
  deriveLabelForUISchemaElement,
  getControlPath,
  isVisible,
  optionIs,
  Paths,
  rankWith,
  toDataPath,
  uiTypeIs,
  type Categorization,
  type Category,
  type RankedTester,
  type StatePropsOfLayout,
  type UISchemaElement,
} from '@jsonforms/core';
import {
  useJsonForms,
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

/** Every data path a category writes to, so its errors can be told apart
 *  from the other categories'. */
const categoryDataPaths = (element: UISchemaElement, basePath: string): string[] => {
  const paths: string[] = [];
  const walk = (el: UISchemaElement | undefined) => {
    if (!el) return;
    const scope = (el as { scope?: string }).scope;
    if (el.type === 'Control' && scope) {
      paths.push(Paths.compose(basePath, toDataPath(scope)));
    }
    ((el as { elements?: UISchemaElement[] }).elements ?? []).forEach(walk);
  };
  walk(element);
  return paths;
};

const pathHasError = (errorPaths: string[], dataPath: string): boolean =>
  errorPaths.some(
    (errorPath) =>
      errorPath === dataPath ||
      errorPath.startsWith(`${dataPath}.`) ||
      errorPath.startsWith(`${dataPath}[`)
  );

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

/**
 * Categorization as a wizard. Unlike the Prime renderer, a step with
 * validation errors is marked instead of being shown as completed (D26).
 *
 * It marks, it does not block: Next stays enabled. A required field hidden
 * by a rule is cleared by MantineInputControl (the lib's documented
 * clear-on-hide deviation), which leaves an error nobody can fix — blocking
 * navigation on it would trap the user in the form.
 */
export const MantineCategorizationStepperLayoutRenderer = (
  props: MantineCategorizationStepperLayoutRendererProps
) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const { core } = useJsonForms();

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

  // D26: a step whose fields are invalid must not be shown as completed.
  // The errors come from the core state; getControlPath turns each one into
  // the data path of the field it belongs to — including the `required`
  // errors, which AJV reports on the parent object with `missingProperty`.
  const errorPaths = useMemo(
    () => (core?.errors ?? []).map((error) => getControlPath(error)),
    [core?.errors]
  );
  const invalidSteps = useMemo(
    () =>
      categories.map((category) =>
        categoryDataPaths(category, path ?? '').some((dataPath) =>
          pathHasError(errorPaths, dataPath)
        )
      ),
    [categories, errorPaths, path]
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
        {categories.map((_, idx) => {
          // Invalid steps keep the number/check off and go danger-coloured,
          // in every state — including the ones already walked past, which
          // is where Mantine would otherwise paint a completed tick.
          const invalidIcon = <i className="pi pi-exclamation-triangle" aria-hidden="true" />;
          return (
            <Stepper.Step
              key={idx}
              label={stepLabels[idx]}
              color={invalidSteps[idx] ? 'danger' : undefined}
              icon={invalidSteps[idx] ? invalidIcon : undefined}
              completedIcon={invalidSteps[idx] ? invalidIcon : undefined}
            />
          );
        })}
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
