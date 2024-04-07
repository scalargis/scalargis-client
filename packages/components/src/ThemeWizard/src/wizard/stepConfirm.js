import React from 'react';
import { useTranslation } from "react-i18next";
import { Button } from 'primereact/button';
import { Message } from 'primereact/message'
import ThemesSelector from './ThemesSelector';
import WMSThemesSelector from './WMSThemesSelector';

import { I18N_NAMESPACE } from './../i18n/index';


export default function WizardStepConfirm(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  let data = props.wizardData;
  return (
    <div>
      
      <h1>{t("confirm", "Confirmar")}</h1>
      
      { data.items && data.items.length > 0 ? (
        data.type === 'wms' ? (
          <WMSThemesSelector 
            themes={data.items}
            selected={data.selected}
            readOnly={true}
            expandAllGroups={true}
          />
        ) : (
          <ThemesSelector
            themes={data.items}
            selected={data.selected}
            readOnly={true}
          />
        ) 
      ) :
        <Message
          severity="info"
          text={t("noThemeSelectedMsg", "Não há nenhum tema selecionado. Volte à etapa anterior e selecione pelo menos um tema.")} 
        />      
      }

      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button 
          onClick={e => props.onSave(data)} 
          label={t("finish", "Concluir")}
          disabled={props.loading || data.items.length === 0}
          style={{ marginTop: '1em' }}
        />
      </div>
    </div>
  )
}
