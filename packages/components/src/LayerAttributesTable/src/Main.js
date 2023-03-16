import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { useState } from 'react';
import ThemeAttributes from './ThemeAttributes';

function hasAttributes(theme) {
  return !['GROUP'].includes(theme.type);
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
  const { getWindowSize, showOnPortal } = models.Utils;  
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

      <Button icon="pi pi-table"
        title="Tabela de atributos"
        color="blue"
        className="p-button-sm p-button-rounded p-button-text tool"
        onClick={e => {
          dispatch(actions.searchlayers_set_layer(target, layer));
          dispatch(actions.viewer_set_selectedmenu(target));
          //setModalThemeAttributesOpen(layer)
        }}
      />

      {showOnPortal(<Dialog 
        header="Tabela de Atributos"
        visible={!!modalThemeAttributesOpen}
        style={{width: isMobile ? '90%' : '50vw' }} 
        modal 
        onHide={e => setModalThemeAttributesOpen(false)}>
        <ThemeAttributes theme={modalThemeAttributesOpen} />
      </Dialog>)}
    </React.Fragment>
  )
}
