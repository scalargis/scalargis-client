import { useMemo, useState } from 'react';
import { Tabs } from '@mantine/core';
import {
  and,
  deriveLabelForUISchemaElement,
  isVisible,
  rankWith,
  uiTypeIs,
  type Categorization,
  type Category,
  type RankedTester,
  type StatePropsOfLayout,
  type Tester,
  type UISchemaElement,
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

export const isSingleLevelCategorization: Tester = and(
  uiTypeIs('Categorization'),
  (uischema: UISchemaElement): boolean => {
    const categorization = uischema as Categorization;

    return (
      categorization.elements &&
      categorization.elements.reduce((acc, e) => acc && e.type === 'Category', true)
    );
  }
);

export const mantineCategorizationTester: RankedTester = rankWith(
  1,
  isSingleLevelCategorization
);

export interface MantineCategorizationLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  selected?: number;
  ownState?: boolean;
  data?: unknown;
  onChange?(selected: number, prevSelected: number): void;
}

export const MantineCategorizationLayoutRenderer = (
  props: MantineCategorizationLayoutRendererProps
) => {
  const {
    data,
    path,
    renderers,
    cells,
    schema,
    uischema,
    visible,
    enabled,
    selected,
    onChange,
    ajv,
    t,
  } = props;
  const categorization = uischema as Categorization;
  // A different set of categories (dynamic uischema) resets the active tab —
  // same guard as the Prime renderer.
  const categorizationKey = JSON.stringify(
    categorization?.elements?.map((e) => ({ type: e.type, label: (e as Category).label }))
  );
  const [previousCategorizationKey, setPreviousCategorizationKey] =
    useState<string>(categorizationKey);
  const [activeCategory, setActiveCategory] = useState<number>(selected ?? 0);

  const categories = useMemo(
    () =>
      (categorization?.elements || []).filter((category) =>
        isVisible(category, data, '', ajv, undefined)
      ),
    [categorization, data, ajv]
  );

  if (categorizationKey !== previousCategorizationKey) {
    setActiveCategory(0);
    setPreviousCategorizationKey(categorizationKey);
  }

  const safeCategory = activeCategory >= categories.length ? 0 : activeCategory;

  const tabLabels = useMemo(
    () => categories.map((e) => deriveLabelForUISchemaElement(e as Category, t)),
    [categories, t]
  );

  const onTabChange = (value: string | null) => {
    const next = Number(value ?? 0);
    onChange?.(next, safeCategory);
    setActiveCategory(next);
  };

  return (
    <div hidden={!visible}>
      <Tabs value={String(safeCategory)} onChange={onTabChange} keepMounted={false}>
        <Tabs.List>
          {categories.map((_, idx) => (
            <Tabs.Tab key={idx} value={String(idx)}>
              {tabLabels[idx]}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {categories.map((category, idx) => {
          const childProps: MantineLayoutRendererProps = {
            elements: (category as Category).elements ?? [],
            schema,
            path,
            direction: 'column',
            enabled,
            visible,
            renderers,
            cells,
          };
          return (
            <Tabs.Panel key={idx} value={String(idx)} pt="sm">
              <MantineLayoutRenderer {...childProps} />
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </div>
  );
};

export default withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(MantineCategorizationLayoutRenderer))
);
