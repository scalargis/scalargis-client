import React from 'react';
import { useTranslation} from "react-i18next";
import { CollapsiblePanel } from '@scalargis/ui';
import MapControls from './MapControls'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return (React.Fragment)
  {/*
  return (
    <Button
      title="Ferramentas do Mapa"
      className={className}
      icon={<IconSliders />}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
  */}
}

export default function Main({ core, as, config, record }) {

  const { actions, mainMap, viewer, dispatch } = config;

  const { t } = useTranslation();

  function renderContent() {
    return (
      <div title={t("mapTools", "Ferramentas do Mapa")}>
        <MapControls
          core={core}
          viewer={viewer}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          record={record}
        />
      </div>  
    )  
  }

  if (as === 'panel') return (
    <CollapsiblePanel header={t("mapTools", "Ferramentas do Mapa")} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  // Render component
  return renderContent()
}
