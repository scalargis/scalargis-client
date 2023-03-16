import React from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message'
import ThemesSelector from './ThemesSelector';
import WMSThemesSelector from './WMSThemesSelector';

export default function WizardStepConfirm(props) {
  let data = props.wizardData;
  return (
    <div>
      
      <h1>Confirmar</h1>
      
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
          text={"Não há nenhum tema selecionado. Volte à etapa anterior e selecione pelo menos um tema."} 
        />      
      }

      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button 
          onClick={e => props.onSave(data)} 
          label="Concluir"
          disabled={props.loading || data.items.length === 0}
          style={{ marginTop: '1em' }}
        />
      </div>
    </div>
  )
}
