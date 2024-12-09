import React, { useState, useMemo } from 'react';
//import { AppBar, Hidden, Tab, Tabs } from '@mui/material';
import { TabView,TabPanel } from 'primereact/tabview';
import {
  and,
  Categorization,
  Category,
  deriveLabelForUISchemaElement,
  isVisible,
  RankedTester,
  rankWith,
  StatePropsOfLayout,
  Tester,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import {
  AjvProps,
  PrimereactLayoutRenderer,
  PrimereactLayoutRendererProps,
  withAjvProps,
} from '../util/layout';

export const isSingleLevelCategorization: Tester = and(
  uiTypeIs('Categorization'),
  (uischema: UISchemaElement): boolean => {
    const categorization = uischema as Categorization;

    return (
      categorization.elements &&
      categorization.elements.reduce(
        (acc, e) => acc && e.type === 'Category',
        true
      )
    );
  }
);

export const primereactCategorizationTester: RankedTester = rankWith(
  1,
  isSingleLevelCategorization
);
/*
// DEBUG
export const primereactCategorizationTester: any = (uischema: any, schema: any, context: any) => {
  console.log('teste');
  const fnRank = rankWith(
    1,
    isSingleLevelCategorization
  );  
  const val = fnRank(uischema, schema, context);
  console.log(val);
  return val;
}
*/

export interface CategorizationState {
  activeCategory: number;
}

export interface PrimereactCategorizationLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  selected?: number;
  ownState?: boolean;
  data?: any;
  onChange?(selected: number, prevSelected: number): void;
}

export const PrimereactCategorizationLayoutRenderer = (
  props: PrimereactCategorizationLayoutRendererProps
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
  const [previousCategorization, setPreviousCategorization] =
    useState<Categorization>(uischema as Categorization);
  const [activeCategory, setActiveCategory] = useState<number>(selected ?? 0);
  const categories = useMemo(
    () =>
      //categorization.elements.filter((category: Category) =>
      (categorization?.elements || []).filter((category: any) =>
        //isVisible(category, data, undefined, ajv)
        isVisible(category, data, '', ajv)
      ),
    [categorization, data, ajv]
  );

  if (categorization !== previousCategorization) {
    setActiveCategory(0);
    setPreviousCategorization(categorization);
  }

  const safeCategory =
    activeCategory >= categorization?.elements?.length ? 0 : activeCategory;

  const childProps: PrimereactLayoutRendererProps = {
    elements: categories[safeCategory] ? categories[safeCategory].elements : [],
    schema,
    path,
    direction: 'column',
    enabled,
    visible,
    renderers,
    cells,
  };
  const onTabChange = (_event: any, value: any) => {
    if (onChange) {
      onChange(value, safeCategory);
    }
    setActiveCategory(value);
  };

  const tabLabels = useMemo(() => {
    //return categories.map((e: Category) => deriveLabelForUISchemaElement(e, t));
    return (categories || []).map((e: any) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  return (    
    <div hidden={!visible} className="p-jsonform">
      <TabView activeIndex={activeCategory} onTabChange={(e) => onTabChange(e, e.index)}>
        {categories.map((_, idx: number) => (
          <TabPanel key={idx} header={tabLabels[idx]}>
              <PrimereactLayoutRenderer {...childProps} key={safeCategory} />
          </TabPanel>
        ))}
      </TabView>
    </div>
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <AppBar position='static'>
        <Tabs
          value={safeCategory}
          onChange={onTabChange}
          textColor='inherit'
          indicatorColor='secondary'
          variant='scrollable'
        >
          {categories.map((_, idx: number) => (
            <Tab key={idx} label={tabLabels[idx]} />
          ))}
        </Tabs>
      </AppBar>
      <div style={{ marginTop: '0.5em' }}>
        <MaterialLayoutRenderer {...childProps} key={safeCategory} />
      </div>
    </Hidden>
  );
  */
};

export default withAjvProps(
  withTranslateProps(
    withJsonFormsLayoutProps(PrimereactCategorizationLayoutRenderer)
  )
);