import React, { useMemo} from 'react';
import { useTranslation } from "react-i18next";
import { Menu, UnstyledButton } from '@mantine/core';


const defaultMode = 'dropdown';


// The login/splash/password pages' locale picker — the viewer twin lives in
// libs/components/LocaleSelector and additionally writes the redux locale;
// this one only talks to i18next (no viewer store exists on these pages).
// The old `type === 'menu'` markup was unreachable from every caller and left
// with the conversion.
export default function LocaleSelector({ type, core, dispatch,  actions, componentConfig, className }) {

  const { t, i18n } = useTranslation();

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
        locales = locales.map(l => { return { label: l.label ?? String(l.value ?? l.values ?? ''), value: l.value ?? l.values } });
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
    if (!val) return;
    i18n.changeLanguage(val);
  }


  if (localesList.length < 2 && !(componentConfig?.show_always === true)) {
    return null;
  }

  if (mode === 'inline') {
    return (
      <div style={{ marginLeft: '15px' }} className={className ? `locale-selector ${className}` : 'locale-selector'}>
        {localesList.map((item, index) => {
          return (
            <React.Fragment key={item.value} >
              <UnstyledButton
                className={i18n.resolvedLanguage === item.value ? 'locale-btn locale-selected' : 'locale-btn'}
                onClick={(e) => handleChange(item.value)}
              >
                {item.label}
              </UnstyledButton>
              {(index < localesList.length - 1) && <span>|</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  const currentLabel =
    localesList.find(item => String(item.value).toLowerCase() === locale.toLowerCase())?.label
    ?? locale.toUpperCase();

  return (
    <Menu shadow="md" position="bottom-end">
      <Menu.Target>
        <UnstyledButton
          className={className ? `locale-selector ${className}` : 'locale-selector'}
          aria-label={t("language", "Idioma")}
        >
          {currentLabel} <span aria-hidden="true">▾</span>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {localesList.map(item => (
          <Menu.Item
            key={item.value}
            onClick={() => handleChange(String(item.value))}
          >
            {item.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );

}