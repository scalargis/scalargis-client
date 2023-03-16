import React, { useEffect, useState } from 'react'

//Cache Arcgis Legend requests
const legendCache = {};

export default function LegendArcGIS({ data, core, actions, models }) {

  const { Utils } = models;
  const { isUrlAppOrigin } = Utils;

  const type = data.legend_type || 'image';
  const label = data.legend_label || 'Legenda';

  const [layers, setLayers] = useState([]);

  useEffect(() => {
    if (!data?.url) return;
    
    let url = `${data.url}/legend?f=pjson`;

    if (!layers.length && legendCache[data.url]) {
      const layers = legendCache[data.url].layers.filter(l => data.layerId.includes(l.layerId));
      setLayers(layers || []);
    } else {
      if (!isUrlAppOrigin(url)) {
        url = core.MAP_PROXY_URL + encodeURIComponent(url);
      }
      
      fetch(url)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then(legend => {
        if (!legend?.layers) throw legend;
        const layers = legend.layers.filter(l => data.layerId.includes(l.layerId));        
        setLayers(layers);
        legendCache[data.url] = legend;
      }).catch(error => {
        console.log(error);
      })
    }
  },[]);

  if (!layers || !layers.length) return null;

  return (
    <div className="legend-container">
      {layers.map(l => {
          return (
            <React.Fragment>
              { layers.length > 1 && <div>{l.layerName}</div> }
              { l.legend.map(leg => {
                return (
                      <ul>
                        <li>
                          <div>
                            <img src={`data:${leg.contentType};base64,${leg.imageData}`} 
                              style={{ verticalAlign: "middle", maxHeight: "25px" }} alt=""/>
                            { leg.label && <span> {leg.label}</span> }
                          </div>
                        </li>
                      </ul>
                    )
                  }
                )
              }
            </React.Fragment>
          )
        })
      }
    </div>
  )
}