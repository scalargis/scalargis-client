import React, { useMemo, useRef } from 'react';
import { Box, Button, Group, Text } from '@mantine/core';
import { isEqual } from 'lodash';
import { JsonForm, viewerConfigSchema } from '@scalargis/components';

import { AJV_OPTIONS, FORM_CONFIG, FORM_I18N, control, inlineRefs, objectElements, pick } from './formViewShared';
import { componentList } from './viewerComponents';

export const HEADER_KEYS = ['title_logo', 'mobile_show_logo', 'embedded_show_logo', 'topbar_right', 'show_menu', 'selected_menu'];

const UISCHEMA = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Group', label: 'Logótipo', elements: ['title_logo', 'mobile_show_logo', 'embedded_show_logo'].map(control) },
    ...objectElements({ topbar_right: viewerConfigSchema.properties.topbar_right }),
    { type: 'Group', label: 'Menu principal', elements: ['show_menu', 'selected_menu'].map(control) }
  ]
};

/** Returns the schema of the Header and menu section, with selected_menu as a choice of the main menu components. */
function buildSchema(options) {
  const root = JSON.parse(JSON.stringify(viewerConfigSchema));
  const properties = inlineRefs(pick(root.properties, HEADER_KEYS), root.definitions);
  const { title, description } = properties.selected_menu;
  properties.selected_menu = options.length
    ? { title, description, type: 'string', oneOf: options.map((o) => ({ const: o.id, title: o.label })) }
    : { title, description, type: 'string' };
  return { type: 'object', properties };
}

/** The Header and menu section of the viewer form view. */
function ViewerHeaderSection({ config, readonly, dataGeneration, writeConfig, getLatest, onOpenComponent }) {
  const records = componentList(config);
  const options = records
    .filter((c) => c.target === 'mainmenu' || c.id === config.selected_menu)
    .map((c) => ({ id: c.id, label: `${c.id} (${c.type})` }));
  const optionsKey = JSON.stringify(options);
  const schema = useMemo(() => buildSchema(JSON.parse(optionsKey)), [optionsKey]);

  const snapshot = useRef({ key: null, data: null });
  const key = `${dataGeneration}:${optionsKey}`;
  if (snapshot.current.key !== key) snapshot.current = { key, data: pick(getLatest() || config, HEADER_KEYS) };

  const onChange = ({ data }) => {
    if (readonly) return;
    const base = getLatest();
    if (!base) return;
    const next = { ...base };
    for (const k of HEADER_KEYS) {
      if (data?.[k] === undefined || data?.[k] === null) delete next[k];
      else next[k] = data[k];
    }
    if (isEqual(pick(next, HEADER_KEYS), pick(base, HEADER_KEYS))) return;
    writeConfig(next);
  };

  const login = records.find((c) => c.type === 'UserLogin');

  return (
    <Box data-testid="form-view-header">
      <JsonForm
        key={key}
        schema={schema}
        uischema={UISCHEMA}
        data={snapshot.current.data}
        onChange={onChange}
        ajvOptions={AJV_OPTIONS}
        config={FORM_CONFIG}
        i18n={FORM_I18N}
        readonly={readonly}
      />
      <Group gap="xs" mt="sm" wrap="nowrap" align="center">
        <Text size="sm" c="dimmed" style={{ flex: 1 }}>
          O cabeçalho e os widgets da janela de entrada são chaves da configuração do componente UserLogin.
        </Text>
        {login &&
          <Button type="button" size="xs" variant="default" onClick={() => onOpenComponent(login.id)}
            data-testid="header-open-userlogin">Abrir UserLogin</Button>
        }
      </Group>
    </Box>
  );
}

export default ViewerHeaderSection;
