import React, { useEffect, useState } from 'react';
import { CollapsiblePanel } from '@scalargis/ui';
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

import { I18N_NAMESPACE, loadTranslations } from './i18n/index'
import StreetView from './StreetView';

/**
 * Component Translations
 */
export const translations = {
  load: loadTranslations
};


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return (React.Fragment)
  {/*const title = record.title || 'Google Street View';

  return (
    <MainMenuButton
      title="Ferramentas do Mapa"
      className={className}
      icon="pi pi-sliders-h"
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
  */}
}

export default function Main(props) {

  const { as, core, config, utils, actions, record } = props;
  const { siteConfig } = core;

  const { mainMap, viewer, dispatch } = config;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Google StreetView';
  const header = component_cfg.header || title;

  const [apiLoaded, setApiLoaded] = useState(!!window?.google?.maps);

  useEffect(() => {
    if (window?.google?.maps) {
      setApiLoaded(true);
      return;
    }

    const apiKey = siteConfig?.googleMaps?.apiKey || import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      setOptions({
        key: apiKey,
        v: "3",
        ...siteConfig?.googleMaps
      });

      importLibrary('streetView')
        .then(() => {
          setApiLoaded(true);
        })
        .catch(e => {
          console.log('Error loading Google Maps API', e);
        });
    }
  }, []);

  function renderContent() {
    return (
      <div title={title}>
        <StreetView
          core={core}
          viewer={viewer}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          record={record}
          utils={utils}
        />
      </div>
    )
  }

  if (as === 'panel') return (
    <CollapsiblePanel header={header} toggleable={false}>
      {renderContent()}
    </CollapsiblePanel>
  )

  // Render component
  return renderContent()
}
