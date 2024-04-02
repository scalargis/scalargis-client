import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

import './style.css';

const defaultMode = 'dropddown';


export default function LocaleSelector({ config, actions, componentConfig, className }) {
  const { viewer, dispatch } = config;
  const { viewer_set_locale } = actions;

  const { i18n } = useTranslation();

  const locale = useMemo(() => {
    return viewer.locale ? viewer.locale : i18n.resolvedLanguage;
  }, [viewer.locale]);

  const localesList = useMemo(() => {
    let locales = [];

    if (viewer?.config_json?.locales?.length) {
      locales = [...viewer.config_json.locales];
    }
    if (componentConfig?.locales?.length) {
      locales = [...componentConfig.locales];
    }
    if (locales?.length) {
      if (typeof locales[0] === 'object') {
        locales = locales.map(l => { return { label: l, value: l.values } });
      } else {
        locales =locales.map(l => { return { label: l, value: l.toLowerCase() } });
      }
    } else {
      locales = [
        { label: i18n.resolvedLanguage.toUpperCase(), value: i18n.resolvedLanguage }
      ]
    }
    return locales;
  }, [componentConfig, locale]);

  const mode = useMemo(() => {
    if (!componentConfig?.mode && localesList?.length <= 3) {
      return 'inline';
    }
    return (componentConfig?.mode || defaultMode).toLowerCase();
  });

  const handleChange = (event) => {
    dispatch(viewer_set_locale(event.value));
  }


  if (localesList.length < 2 && !(componentConfig?.show_always === true)) {
    return null;
  }

  if (mode === 'inline') {
    return (
      <div style={{ marginLeft: '20px' }} className={className ? `locale-selector ${className}` : 'locale-selector'}>
        {localesList.map((item, index) => {
          return (
            <React.Fragment key={item.value} >
              <Button
                key={item.value}
                label={item.label}
                className={`p-button-text ${i18n.resolvedLanguage === item.value ? 'locale-selected' : ''}`}
                onClick={(e) => dispatch(viewer_set_locale(item.value))}
              />
              {(index < localesList.length - 1) && <span>|</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <Dropdown value={locale.toLowerCase()} options={localesList} onChange={handleChange} className={className ? `locale-selector ${className}` : 'locale-selector'} />
  );

}