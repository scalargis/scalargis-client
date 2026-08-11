import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Menu, UnstyledButton } from '@mantine/core';

import './style.css';

const defaultMode = 'dropdown';


export default function LocaleSelector({ type, config, actions, componentConfig, className }) {
  const { viewer, dispatch } = config;
  const { viewer_set_locale } = actions;

  const { t, i18n } = useTranslation();

  const locale = useMemo(() => {
    return viewer.locale || i18n.resolvedLanguage || i18n.language;
  }, [viewer.locale, i18n.language]);

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
        locales = locales.map(l => { return { label: l.label ?? String(l.value ?? l.values ?? ''), value: l.value ?? l.values } });
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

  const handleChange = (value) => {
    if (!value) return;
    i18n.changeLanguage(value); // Save to localStorage
    dispatch(viewer_set_locale(value));
  }


  if (localesList.length < 2 && !(componentConfig?.show_always === true)) {
    return null;
  }

  if (mode === 'inline') {
    const buttons = localesList.map((item, index) => {
      return (
        <React.Fragment key={item.value} >
          <UnstyledButton
            className={i18n.resolvedLanguage === item.value ? 'locale-btn locale-selected' : 'locale-btn'}
            onClick={(e) => {
              e.preventDefault();
              i18n.changeLanguage(item.value);
              dispatch(viewer_set_locale(item.value));
            }}
          >
            {item.label}
          </UnstyledButton>
          {(index < localesList.length - 1) && <span>|</span>}
        </React.Fragment>
      );
    });

    return (
      <React.Fragment>
        { type != 'menu' ?
          <div style={{ marginLeft: '15px' }} className={className ? `locale-selector ${className}` : 'locale-selector'}>
            {buttons}
          </div> :
          <span className="sg-menuitem">
            <span className="pi pi-globe"></span>
            <div className={className ? `locale-selector ${className}` : 'locale-selector'}>
              {buttons}
            </div>
          </span> }
      </React.Fragment>
    );
  }

  // A Select is an input — a ~37px box with a rightSection and form alignment —
  // which stood out in a 50px strip of 1em icons. The widget is really a choice
  // menu, so it IS one: a text trigger ("PT ▾") that, being a real <button>,
  // inherits the topbar chrome (_topbar.scss `button` rule) like every sibling.
  const currentLabel = useMemo(() => {
    const match = localesList.find(
      item => String(item.value).toLowerCase() === locale.toLowerCase()
    );
    return match?.label ?? locale.toUpperCase();
  }, [localesList, locale]);

  const menu = (
    <Menu shadow="md" position="bottom-end" withinPortal>
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

  return (
    <React.Fragment>
      { type != 'menu' ?
      menu :
      <span className="sg-menuitem">
        <span className="pi pi-globe"></span>{menu}
      </span> }
    </React.Fragment>
  );

}
