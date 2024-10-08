import React, { useState } from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

export default function Main(props) {

  const { config } = props;
  const { layer, actions, models, viewer } = config;
  const { isComponentExcludedForLayer } = models.Utils;

  const [confirmDeleteTheme, setConfirmDeleteTheme] = useState(false);

  const { t } = useTranslation();

  const exclude = isComponentExcludedForLayer(viewer, layer, "LayerRemove");

  if (exclude) return null;

  return (
    <React.Fragment>
      <Button icon="pi pi-times-circle"
        title={t("removeTheme", "Remover Tema")}
        color="red"
        className="p-button-sm p-button-rounded p-button-text tool"
        onClick={e => setConfirmDeleteTheme([layer.id])}
      />

      <Dialog
        header={t("removeTheme", "Remover Tema")}
        visible={!!confirmDeleteTheme} 
        modal 
        style={{ width: '350px' }} 
        footer={(
          <div>
              <Button 
                label={t("no", "Não" )}
                icon="pi pi-times" 
                onClick={() => setConfirmDeleteTheme(false)} 
                className="p-button-text"
              />
              <Button 
                label={t("yes", "Sim" )}
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
              <span>{t("confirmAction", "Tem a certeza?")}</span>
          </div>
      </Dialog>
    </React.Fragment>
    
  )
}
