/*
Simple component for displaying text information in JSON Forms
*/
import React, { useMemo } from 'react';

import { JsonSchema, UISchemaElement, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsControlProps, withTranslateProps } from '@jsonforms/react';

import { useTranslation } from "react-i18next";


const TextDisplay = (props) => {
  const { data, uischema, visible, locale } = props;

  const { t } = useTranslation();

  const htmlText = useMemo(() => {
    let _text = uischema.text;

    if (uischema.text && uischema?.i18n && (data || uischema?.data)) {
      const _data = uischema?.data || data;
      _text = t(uischema?.i18n, _text, _data);
    }

    return _text;
  }, [locale, data, uischema.text]);

  return visible ? (
    <div className={uischema?.className}>{htmlText}</div>
  ) : null;
};

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsControlProps(
  withTranslateProps(React.memo(TextDisplay)),
  false
);

export const textDisplayTester = rankWith(
  4, //increase rank as needed
  uiTypeIs('Text')
);