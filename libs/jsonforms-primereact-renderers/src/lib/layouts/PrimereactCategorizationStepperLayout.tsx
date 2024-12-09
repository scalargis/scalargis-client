import React, { useState, useMemo } from 'react';
import merge from 'lodash/merge';
//import { Button, Hidden, Step, StepButton, Stepper } from '@mui/material';
import {Steps} from 'primereact/steps';
import { Button } from 'primereact/button';
import {
  and,
  Categorization,
  categorizationHasCategory,
  Category,
  deriveLabelForUISchemaElement,
  isVisible,
  optionIs,
  RankedTester,
  rankWith,
  StatePropsOfLayout,
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
import { i18nDefaults } from '../util';


const isStepperReadOnly = (uiSchemaOptions: any): boolean => {
  return !uiSchemaOptions.showNavButtons
    ? false
    : !!uiSchemaOptions.stepperReadOnly;
};

export const primereactCategorizationStepperTester: RankedTester = rankWith(
  2,
  and(
    uiTypeIs('Categorization'),
    categorizationHasCategory,
    optionIs('variant', 'stepper')
  )
);

export interface CategorizationStepperState {
  activeCategory: number;
}

export interface PrimereactCategorizationStepperLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  data: any;
}

export const PrimereactCategorizationStepperLayoutRenderer = (
  props: PrimereactCategorizationStepperLayoutRendererProps
) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const handleStep = (step: number) => {
    setActiveCategory(step);
  };

  const {
    data,
    path,
    renderers,
    schema,
    uischema,
    visible,
    cells,
    config,
    ajv,
    t,
    locale,
  } = props;

  const categorization = uischema as Categorization;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const buttonWrapperStyle = {
    textAlign: 'right' as const,
    width: '100%',
    margin: '1em auto',
  };
  const buttonNextStyle = {
    float: 'right' as const,
    width: 'auto' as const
  };
  const buttonStyle = {
    marginRight: '1em',
    width: 'auto' as const
  };
  const categories = useMemo(
    () =>
      //categorization.elements.filter((category: Category) =>
      categorization.elements.filter((category: any) =>
        //isVisible(category, data, undefined, ajv)
        isVisible(category, data, '', ajv)
      ),
    [categorization, data, ajv]
  );

  const safeCategory =
    activeCategory >= categorization?.elements?.length ? 0 : activeCategory;

  const childProps: PrimereactLayoutRendererProps = {
    elements: categories[activeCategory].elements,
    schema,
    path,
    direction: 'column',
    visible,
    renderers,
    cells,
  };
  const tabLabels = useMemo(() => {
    //return categories.map((e: Category) => deriveLabelForUISchemaElement(e, t));
    return categories.map((e: any) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  const previousButtonLabel = useMemo( () => {
    let msg;
    locale 
      ? msg = t(`${locale}.stepper.previous`, i18nDefaults['stepper.previous'], { schema, uischema, path })
      : msg = t('stepper.previous', i18nDefaults['stepper.previous'], { schema, uischema, path });    
    return msg;
  }, [t, schema, uischema, path]);
  const nextButtonLabel = useMemo( () => {
    let msg;
    locale 
      ? msg = t(`${locale}.stepper.next`, i18nDefaults['stepper.next'], { schema, uischema, path })
      : msg = t('stepper.next', i18nDefaults['stepper.next'], { schema, uischema, path });    
    return msg;
  }, [t, schema, uischema, path]);

  const items = tabLabels.map(l => {return { label: l}});

  return (
    <div hidden={!visible} className="p-jsonform">
      <Steps
        model={items} 
        activeIndex={activeCategory}
        onSelect={(e) => handleStep(e.index)}
        readOnly={isStepperReadOnly(appliedUiSchemaOptions)} 
      />
      <PrimereactLayoutRenderer {...childProps} key={safeCategory} />
      {appliedUiSchemaOptions.showNavButtons ? (
        <div style={buttonWrapperStyle}>
          <div>
            <Button
              style={buttonNextStyle}
              //variant='contained'
              color='primary'
              disabled={activeCategory >= categories.length - 1}
              onClick={() => handleStep(activeCategory + 1)}
            >
              {nextButtonLabel || "Next"}
            </Button>
            <Button
              style={buttonStyle}
              color='secondary'
              //variant='contained'
              disabled={activeCategory <= 0}
              onClick={() => handleStep(activeCategory - 1)}
            >
              {previousButtonLabel || "Previous"}
            </Button>
          </div>
        </div>
      ) : (
        <></>
      )}      
    </div>
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <Stepper activeStep={activeCategory} nonLinear>
        {categories.map((_: Category, idx: number) => (
          <Step key={tabLabels[idx]}>
            <StepButton onClick={() => handleStep(idx)}>
              {tabLabels[idx]}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <div>
        <MaterialLayoutRenderer {...childProps} />
      </div>
      {appliedUiSchemaOptions.showNavButtons ? (
        <div style={buttonWrapperStyle}>
          <Button
            style={buttonNextStyle}
            variant='contained'
            color='primary'
            disabled={activeCategory >= categories.length - 1}
            onClick={() => handleStep(activeCategory + 1)}
          >
            Next
          </Button>
          <Button
            style={buttonStyle}
            color='secondary'
            variant='contained'
            disabled={activeCategory <= 0}
            onClick={() => handleStep(activeCategory - 1)}
          >
            Previous
          </Button>
        </div>
      ) : (
        <></>
      )}
    </Hidden>
  );
  */
};

export default withAjvProps(
  withTranslateProps(
    withJsonFormsLayoutProps(PrimereactCategorizationStepperLayoutRenderer)
  )
);