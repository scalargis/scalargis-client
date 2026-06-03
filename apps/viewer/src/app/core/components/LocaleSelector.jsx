import React, { useMemo} from 'react';
import { useTranslation } from "react-i18next";
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';


const defaultMode = 'dropddown';


export default function LocaleSelector({ type, core, dispatch,  actions, componentConfig, className }) {
  
  const { i18n } = useTranslation();

  let locale = i18n.resolvedLanguage || i18n.language;
  if (locale.split("-").length > 1) {
    locale = locale.split("-")[0];
  }
  
  const localesList = useMemo(() => {
    let locales = [];

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
      const fallbackLocale = i18n.resolvedLanguage || i18n.language || 'en';
      locales = [
        { label: fallbackLocale.toUpperCase(), value: fallbackLocale }
      ]
    }

    return locales;
  }, [i18n?.resolvedLanguage]);

  const mode = useMemo(() => {
    if (!componentConfig?.mode && localesList?.length <= 3) {
      return 'inline';
    }
    return (componentConfig?.mode || defaultMode).toLowerCase();
  });

  const handleChange = (val) => {
    i18n.changeLanguage(val);
  }


  if (localesList.length < 2 && !(componentConfig?.show_always === true)) {
    return null;
  }

  if (mode === 'inline') {
    return (
      <React.Fragment>
        { type != 'menu' ?
          <div style={{ marginLeft: '15px' }} className={className ? `flex align-items-center justigt-content-end locale-selector ${className}` : 'locale-selector'}>
            {localesList.map((item, index) => {
              return (
                <React.Fragment key={item.value} >
                  <Button
                    key={item.value}
                    label={item.label}
                    text
                    className={i18n.resolvedLanguage === item.value ? 'locale-selected' : undefined}
                    onClick={(e) => handleChange(item.value)}
                  />
                  {(index < localesList.length - 1) && <span>|</span>}
                </React.Fragment>
              );
            })}
          </div> :
          <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" >
            <span className="p-menuitem-icon pi pi-flag"></span>
            <div className={className ? `locale-selector ${className}` : 'locale-selector'}>
              {localesList.map((item, index) => {
                return (
                  <React.Fragment key={item.value} >
                    <Button
                      key={item.value}
                      label={item.label}
                      text
                      className={i18n.resolvedLanguage === item.value ? 'locale-selected' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        handleChange(item.value);
                      }}
                    />
                    {(index < localesList.length - 1) && <span>|</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </a> }
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      { type != 'menu' ?
      <Dropdown value={locale.toLowerCase()} options={localesList} 
        onChange={(e)=> handleChange(e.value)} 
        className={className ? `locale-selector ${className}` : 'locale-selector'} /> :
      <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" >
        <span className="p-menuitem-icon pi pi-flag"></span>
        <Dropdown value={locale.toLowerCase()} options={localesList} 
          onChange={(e)=>{
            e.preventDefault();
            handleChange(e.value);
          }}
          className={className ? `locale-selector ${className}` : 'locale-selector'} />
      </a> }
    </React.Fragment>
  );

}