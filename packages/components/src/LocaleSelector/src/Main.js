import React, { useMemo } from 'react';
import { useTranslation} from "react-i18next";
import { Dropdown } from 'primereact/dropdown';

import './style.css';

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
    return viewer.locale ? viewer.locale : i18n.language;
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
        { label: i18n.language, value: i18n.language}
      ]
    }
    return locales;
  }, [record?.config_json, locale]);

  const handleChange = (event) => {
    dispatch(viewer_set_locale(event.value));
  }

  return (
    <Dropdown value={locale.toLowerCase()} options={localesList} onChange={handleChange} className='locale-selector p-ml-3 p-ml-3' />
  );

}