import React from 'react'

export default function Legend({ data, actions }) {

  const type = data.legend_type || 'image';
  const label = data.legend_label || 'Legenda';

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