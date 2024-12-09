import React, { useState } from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import EditNode from './EditNode';

export default function Main(props) {

  const { config } = props;
  const { layer, actions, models, viewer } = config;
  const { getWindowSize, showOnPortal, isComponentExcludedForLayer } = models.Utils;

  const [modalEditOpen, setModalEditOpen] = useState(null);

  const { t } = useTranslation();  

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const exclude = isComponentExcludedForLayer(viewer, layer, "LayerEdit");

  if (exclude) return null;
  
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
