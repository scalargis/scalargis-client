import React from 'react'
import LegendArcGIS from './LegendArcGIS';

export default function Legend({ viewer, tocConfig, data, core, actions, models }) {

  const type = data.legend_type || 'image';
  const label = data.legend_label || 'Legenda';

  //Return ArcGIS Legend for arcgis source
  if (data.type === 'ArcGISMap' && !data.legend_url) return (
    <LegendArcGIS data={data} core={core} actions={actions} models={models} />
  )

  // Validate legend
  if (!data.legend_url) return null;

  const auth = core.store.getState()['root'].auth;

  // Render legend link
  if (type === 'link') return (
    <div className="legend-container">
      <a target="_blank" title="Clique para abrir num separador"
        rel="noopener noreferrer"
        href={actions.getThemeLegendUrl(viewer, data, auth)}>
        { label }
      </a>
    </div>
  );

  console.log(tocConfig);

  if (tocConfig?.open_legend_image === false) return (
    <div className="legend-container">
        <img src={actions.getThemeLegendUrl(viewer, data, auth)} alt='' />
    </div>
  );

  // Render legend image
  return (
    <div className="legend-container">
      <a target="_blank" title="Clique para abrir num separador"
        rel="noopener noreferrer"
        href={actions.getThemeLegendUrl(viewer, data, auth)}>
        <img src={actions.getThemeLegendUrl(viewer, data, auth)} alt='' />
      </a>
    </div>
  );
}
