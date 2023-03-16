import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { useState } from 'react';
import ThemeInfo from './ThemeInfo';

export default function Main({ core, config }) {

  const { layer, viewer, mainMap, actions, models } = config;
  const { getWindowSize, showOnPortal } = models.Utils;  
  const [modalThemeInfoOpen, setModalThemeInfoOpen] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  // Use layers.exclude_components prop to exclude component
  if (layer && layer.exclude_components && layer.exclude_components.includes('LayerMetadata')) return null;  

  return (
    <React.Fragment>

      <Button icon="pi pi-info-circle"
        title="Informação de Metadados"
        color="blue"
        className="p-button-sm p-button-rounded p-button-text tool"
        onClick={e => setModalThemeInfoOpen(layer)}
      />

      {showOnPortal(<Dialog 
        header="Informação do Tema"
        visible={!!modalThemeInfoOpen}
        style={{width: isMobile ? '90%' : '50vw' }}  
        modal 
        onHide={e => setModalThemeInfoOpen(false)}>
        <ThemeInfo
          viewer={viewer}
          mainMap={mainMap}
          core={core}
          models={models}
          theme={modalThemeInfoOpen}
          downloadTheme={theme => actions.downloadTheme(theme)}
        />
      </Dialog>)}
    </React.Fragment>
  )
}
