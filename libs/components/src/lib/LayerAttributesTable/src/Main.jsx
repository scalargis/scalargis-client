import React, { useState } from 'react';
import { ActionIcon, Modal } from '@mantine/core';
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
  const { getWindowSize } = models.Utils;
  const [modalThemeAttributesOpen, setModalThemeAttributesOpen] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

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
          //setModalThemeAttributesOpen(layer)
        }}
      >
        <i className="pi pi-table" aria-hidden="true" />
      </ActionIcon>

      <Modal
        title="Tabela de Atributos"
        opened={!!modalThemeAttributesOpen}
        size={isMobile ? '90%' : '50vw'}
        onClose={e => setModalThemeAttributesOpen(false)}>
        <ThemeAttributes theme={modalThemeAttributesOpen} />
      </Modal>
    </React.Fragment>
  )
}
