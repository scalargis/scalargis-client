import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { useState } from 'react';

export default function Main({ config }) {

  const { layer, actions } = config;
  const [confirmDeleteTheme, setConfirmDeleteTheme] = useState(false);

  // Use layers.exclude_components prop to exclude component
  if (layer && layer.exclude_components && layer.exclude_components.includes('LayerRemove')) return null;

  return (
    <React.Fragment>
      <Button icon="pi pi-times-circle"
        title="Remover Tema"
        color="red"
        className="p-button-sm p-button-rounded p-button-text tool"
        onClick={e => setConfirmDeleteTheme([layer.id])}
      />

      <Dialog
        header="Confirmar" 
        visible={!!confirmDeleteTheme} 
        modal 
        style={{ width: '350px' }} 
        footer={(
          <div>
              <Button 
                label="Não" 
                icon="pi pi-times" 
                onClick={() => setConfirmDeleteTheme(false)} 
                className="p-button-text"
              />
              <Button 
                label="Sim" 
                icon="pi pi-check" 
                onClick={() => {
                  actions.removeThemes(confirmDeleteTheme);
                  setConfirmDeleteTheme(false);
                }} 
                autoFocus 
              />
          </div>
        )} 
        onHide={() => setConfirmDeleteTheme(false)}>
          <div className="confirmation-content">
              <i className="pi pi-exclamation-triangle p-mr-3" style={{ fontSize: '2rem' }} />
              <span>Tem a certeza?</span>
          </div>
      </Dialog>
    </React.Fragment>
    
  )
}
