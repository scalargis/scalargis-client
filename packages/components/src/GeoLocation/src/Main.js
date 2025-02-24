import React from 'react'
import { useTranslation} from "react-i18next"
import { Button } from 'primereact/button'
import OLGroupLayer from "ol/layer/Group"
import { Panel } from 'primereact/panel'
import GeoLocation from './GeoLocation'

import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { t } = useTranslation();

  return (
    <Button
      title={t("myLocation", "A minha localização")}
      className={className}
      icon="pi pi-globe"
      /*style={{ margin: '0.5em 1em' }}*/
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

export default function Main({ as, config, actions, record }) {

  const { viewer, dispatch } = config;

  const { t } = useTranslation();

  // Render content
  function renderContent() {
    return (
      <div className="geo-location">

        <GeoLocation
          config={config}
          actions={actions}
          dispatch={dispatch}
          record={record}
        />
        
      </div>
    )
    
  }

  if (as === 'panel') return (
    <Panel header={t("myLocation", "A minha localização")}>
      { renderContent() }
    </Panel>
  )

  return null
}