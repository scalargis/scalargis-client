import React, { useMemo } from 'react';
import { useTranslation} from "react-i18next";
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

import './style.css';

const defaultMode = 'dropddown';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return null;
}

export default function Main({ as, config, actions, record }) {
  const { viewer, dispatch } = config;
  const { viewer_set_locale } = actions;

  const { i18n } = useTranslation();

  const locale = useMemo(()=> {
    return viewer.locale ? viewer.locale : i18n.resolvedLanguage;
  }, [viewer.locale]);
  
  const localesList = useMemo(() => {
    let locales = [];
    if (record?.config_json?.locales?.length) {
      if (typeof record.config_json.locales[0] === 'object') {
        locales = record.config_json.locales.map(l => { return { label: l, value: l.values }});
      } else {
        locales = record.config_json.locales.map(l => {return {label: l, value: l.toLowerCase()}});
      }
    } else {
      locales = [
        { label: i18n.resolvedLanguage.toUpperCase(), value: i18n.resolvedLanguage}
      ]
    }
    return locales;
  }, [record?.config_json, locale]);  

  const mode = useMemo(() => {
    if (!record?.config_json?.mode && localesList?.length <= 3) {
      return 'inline';
    }
    return (record?.config_json?.mode || defaultMode).toLowerCase();
  });  

  const handleChange = (event) => {
    dispatch(viewer_set_locale(event.value));
  }


  if (localesList.length < 2 && !(record?.config_json?.show_always === true)) {
    return null;
  } 
  
  if (mode === 'inline') {
    return (
      <div style={{marginLeft: '20px'}} className='locale-selector'>
        {localesList.map((item) => {
          return (
            <Button
              key={item.value} 
              label={item.label} 
              style={{
                marginLeft: 'unset',
                minWidth: 'unset',
              }}
              className={`p-button-text ${ i18n.resolvedLanguage === item.value ? 'locale-selected' : ''}`}
              onClick={(e)=>dispatch(viewer_set_locale(item.value))}
            />
          );
        })}
      </div>
    );
  }

  return (
    <Dropdown value={locale.toLowerCase()} options={localesList} onChange={handleChange} className='locale-selector' />
  );  
  
}