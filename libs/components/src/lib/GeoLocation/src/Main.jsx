import React from 'react'
import { useTranslation} from "react-i18next"
import { CollapsiblePanel, IconGlobe } from '@scalargis/ui'
import { MainMenuButton } from '../../components'
import GeoLocation from './GeoLocation'

import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { t } = useTranslation();

  return (
    <MainMenuButton
      title={t("myLocation", "A minha localização")}
      className={className}
      icon={<IconGlobe />}
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
    <CollapsiblePanel header={t("myLocation", "A minha localização")} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  return null
}
