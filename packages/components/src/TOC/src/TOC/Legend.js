import React from 'react'
import LegendArcGIS from './LegendArcGIS';

export default function Legend({ data, core, actions, models }) {

  const type = data.legend_type || 'image';
  const label = data.legend_label || 'Legenda';

  //Return ArcGIS Legend for arcgis source
  if (data.type === 'ArcGISMap' && !data.legend_url) return (
    <LegendArcGIS data={data} core={core} actions={actions} models={models} />
  )

  // Validate legend
  if (!data.legend_url) return null;

  // Render legend link
  if (type === 'link') return (
    <div className="legend-container">
      <a target="_blank" title="Clique para abrir num separador"
        rel="noopener noreferrer"
        href={actions.getThemeLegendUrl(data)}>
        { label }
      </a>
    </div>
  );

  // Render legend image
  return (
    <div className="legend-container">
      <a target="_blank" title="Clique para abrir num separador"
        rel="noopener noreferrer"
        href={actions.getThemeLegendUrl(data)}>
        <img src={actions.getThemeLegendUrl(data)} alt='' />
      </a>
    </div>
  )
}