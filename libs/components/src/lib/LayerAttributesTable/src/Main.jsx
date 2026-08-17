import React from 'react';
import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dialog, useIsMobile } from '@scalargis/ui';
import ThemeAttributes from './ThemeAttributes';

function hasAttributes(theme) {
  return !['GROUP'].includes(theme.type) || theme.datatable;
}

/**
 * Actions
 */
export const actions = {
  layer_has_attributes: hasAttributes
}

/**
 * Main component
 */
export default function Main(props) {

  const { config } = props;
  const { layer, dispatch, actions, models } = config;
  const [opened, { open, close }] = useDisclosure(false);

  const isMobile = useIsMobile();

  const target = layer?.datatable?.target || props?.config?.target;

  // Use layers.exclude_components prop to exclude component
  if (layer && layer.exclude_components && layer.exclude_components.includes('LayerAttributesTable')) return null;

  // If doesn't have datable reference info
  if (!layer || !layer.datatable || !target) return null;

  if (!hasAttributes(layer)) return null;
  return (
    <React.Fragment>

      {' '}

      <ActionIcon
        variant="subtle"
        size="md"
        radius="xl"
        className="tool"
        title="Tabela de atributos"
        aria-label="Tabela de atributos"
        onClick={e => {
          dispatch(actions.searchlayers_set_layer(target, layer));
          dispatch(actions.viewer_set_selectedmenu(target));
          //open()
        }}
      >
        <i className="pi pi-table" aria-hidden="true" />
      </ActionIcon>

      <Dialog
        title="Tabela de Atributos"
        opened={opened}
        size={isMobile ? '90%' : '50vw'}
        onClose={close}>
        <ThemeAttributes theme={layer} />
      </Dialog>
    </React.Fragment>
  )
}
