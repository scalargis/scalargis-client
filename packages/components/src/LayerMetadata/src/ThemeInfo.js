import React from 'react';


const formatMetadataValue = (element) => {
    if (element.type === 'html') {
        return <div dangerouslySetInnerHTML={{__html: element.value}} />
    } else if (element.type === 'hyperlink') {
        return (
            <a href={element.url} target="_blank" rel="noopener noreferrer" style={{"textDecoration": "none"}}>
                <i className="pi pi-external-link p-mr-2"></i>{ element.value || element.url }
            </a>
        );
    } else {
        return element.value || '';
    }
};

class ThemeInfo extends React.Component {
  
  getTypeDescription(type) {
      switch(type) {
        case 'OSM': return 'Open Street Map';
        case 'BING': return 'Bing Maps';
        case 'WMS': return 'Web Map Service';
        case 'WFS': return 'Web Feature Service';
        case 'ArcGISMap': return 'ArcGIS REST - Map Service';
        case 'KML': return 'Keyhole Markup Language';
        case 'GeoJSON': return 'GeoJSON';
        case 'GROUP': return 'Grupo';
        default: return type;
      }
  }

  render() {
    const { viewer, mainMap, core, theme, actions, models } = this.props;
    return (
      <div>
        <div className="p-grid">
            <div className="p-col-4">Título</div>
            <div className="p-col-8">{theme.title}</div>
        </div>
        { theme.description ?
        <div className="p-grid">
            <div className="p-col-4">Descrição</div>
            <div className="p-col-8">{theme.description}</div>
        </div> : null }
        { (theme.metadata && theme.metadata.url) ?
        <div className="p-grid">
            <div className="p-col-4">Metadados</div>
            <div className="p-col-8"><a href={theme.metadata.url} target="_blank" rel="noopener noreferrer" style={{"textDecoration": "none"}}><i className="pi pi-external-link p-mr-2"></i>Abrir Ficha</a></div>
        </div> : null }
        { (theme.metadata && theme.metadata.data) ?
            theme.metadata.data.map(d => {
                return (
                    <div className="p-grid">
                        <div className="p-col-4">{d.title || d.name}</div>
                        <div className="p-col-8">{formatMetadataValue(d)}</div>
                    </div>
                )
            }) : null }        
        { (theme.exclude_service_metadata !== true) ?
        (<>               
            <div className="p-grid">
                <div className="p-col-4">Tipo</div>
                <div className="p-col-8">{this.getTypeDescription(theme.type)}</div>
            </div>
            { !['GROUP'].includes(theme.type) ? (
            <div className="p-grid">
                <div className="p-col-4">URL</div>
                <div className="p-col-8" style={{wordBreak: "break-all"}}>{theme.url}</div>
            </div>
            ) : null }
            { !['GROUP', 'ArcGISMap'].includes(theme.type) ? (
            <div className="p-grid">
                <div className="p-col-4">Sistema de Coordenadas</div>
                <div className="p-col-8">
                    { theme.crs_options ? (
                        <ul>
                        { theme.crs_options.split(',').map((t, j) => (
                            <li key={j}>{t}</li>
                        ))}
                        </ul>
                    ) : theme.crs ? (
                        <ul><li>{`EPSG:${theme.crs}`}</li></ul>
                    ) : null }
                </div>
            </div>
            ) : null }
            { ['WMS'].includes(theme.type) ? (
            <div className="p-grid">
                <div className="p-col-4">Formatos de GetMap</div>
                <div className="p-col-8">
                    { theme.get_map_formats ? (
                        <ul>
                        { theme.get_map_formats.split(',').map((t, j) => (
                            <li key={j}>{t}</li>
                        ))}
                        </ul>
                    ) : null }
                </div>
            </div>
            ) : null }
            { ['WMS'].includes(theme.type) ? (
            <div className="p-grid">
                <div className="p-col-4">Formatos de GetFeatureInfo</div>
                <div className="p-col-8">
                    { theme.get_feature_info_formats ? (
                        <ul>
                        { theme.get_feature_info_formats.split(',').map((t, j) => (
                            <li key={j}>{t}</li>
                        ))}
                        </ul>
                    ) : null }
                </div>
            </div>
            ) : null }
        </>
        ) : null }

        { core.renderComponents({
          region: 'theme_info_tools',
          props: { layer: theme, actions, viewer, mainMap, models },
          separator: " "
        })}

      </div>
    );
  }
}

export default ThemeInfo;