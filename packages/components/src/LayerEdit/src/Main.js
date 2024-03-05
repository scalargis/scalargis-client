import React, { useState } from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import EditNode from './EditNode';

export default function Main({ config }) {

  const { layer, actions, models } = config;
  const { getWindowSize, showOnPortal } = models.Utils;
  //const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(null);

  const { t } = useTranslation();  

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  // Use layers.exclude_components prop to exclude component
  if (layer && layer.exclude_components && layer.exclude_components.includes('LayerEdit')) return null;
  
  return (
    <React.Fragment>

      <Button icon="pi pi-pencil"
        title={t("personalizarTema", "Personalizar Tema")}
        color="green"
        className="p-button-sm p-button-rounded p-button-text tool"
        onClick={e => setModalEditOpen({...layer})}
      />

      {showOnPortal(<Dialog 
        header={t("personalizarTema", "Personalizar Tema")}
        visible={!!modalEditOpen} 
        style={{width: isMobile ? '90%' : '50vw' }} 
        modal 
        onHide={e => setModalEditOpen(false)}>
        <EditNode
          edit={modalEditOpen}
          onSave={(e, theme) => {
            setModalEditOpen(null);
            actions.applyThemeChanges(theme);
          }}
        />
      </Dialog>)}
    </React.Fragment>
  )
}
