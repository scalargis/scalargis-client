import React, { useEffect, useState, useRef } from 'react'
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast'
import OlFormatGeoJSON from 'ol/format/GeoJSON';

/*
// TODO: implement theme download
function downloadTheme(theme) {

}

export const actions = {
  downloadTheme
}
*/

const defaultExportFormats = [
  { value: "geojson", title: "GeoJSON", icon: "pi pi-file", tooltip: "Exportar para ficheiro GeoJSON",
    outputFormat: "application/json" },
  { value: "gml", title: "GML", icon: "pi pi-file", tooltip: "Exportar para ficheiro GML",
    outputFormat: "text/xml; subtype=gml/2.1.2" },
  { value: "shape", title: "ShapeFile", icon: "pi pi-file", tooltip: "Exportar para ficheiro ShapeFile",
    outputFormat: "SHAPE-ZIP" },
  { value: "kml", title: "KML", icon: "pi pi-file", tooltip: "Exportar para ficheiro KML",
    outputFormat: "application/vnd.google-earth.kml+xml" }
];

export default function Main({ core, config, record }) {

  const { viewer, layer, actions, mainMap, models } = config;
  const { showOnPortal } = models.Utils;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState(null);

  const toast = useRef(null)

  const component_cfg = record.config_json;

  let exportFormats = [...defaultExportFormats];
  if (layer && layer.exclude_export_formats && layer.exclude_export_formats.length) {
    exportFormats = defaultExportFormats.filter(t => !layer.exclude_export_formats.includes(t.value));
  } else if  (component_cfg && component_cfg.exclude_export_formats && component_cfg.exclude_export_formats.length) {
    exportFormats = defaultExportFormats.filter(t => !component_cfg.exclude_export_formats.includes(t.value));
  } else if (viewer && viewer.config_json && viewer.config_json.exclude_export_formats) {
    exportFormats = defaultExportFormats.filter(t => !viewer.config_json.exclude_export_formats.includes(t.value));
  }

  let linkDownload = null;
  if (layer && layer.download && layer.download.link) {
    linkDownload = {...layer.download.link}
  }

  let externalDownload = null;
  if (layer && layer.download && layer.download.external) {
    externalDownload  = {...layer.download.external}
  }

  let datasourceDownload = null;
  if (layer && layer.download && layer.datasource) {
    datasourceDownload  = {...layer.download.datasource}
  }

  function getWFSFeatures(request) {
    let params = [
      "SERVICE=WFS",
      "REQUEST=GetFeature",
      "VERSION=" + (request.version || "2.0.0"), //1.1.0
      "typeNames=" + request.typeNames,
      "srsName=" + request.srsName,
      "outputFormat=" + (request.outputFormat || "application/json")
    ];

    // Add count
    if (request.count) params.push("count=" + request.count);

    // Add bbox
    if (request.bbox) params.push("bbox=" + request.bbox.join(","));

    // Add CQL_FILTER
    if (request.cqlFilter) params.push("cql_filter=" + request.cqlFilter)

    // Add propertyName
    if (request.propertyName) params.push("propertyName=" + request.propertyName)
    
    // Build final URL
    let url = request.url + params.join('&');

    // Use map proxy
    if (!models.Utils.isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    };

    // Set headers
    let headers = {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
    };

    // Set request options
    const options = {
      //"headers": headers,
      //"referrer": "",
      //"referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      //"mode": "cors",
      //"credentials": "include"
    };

    // return request
    return fetch(url, options);
  }

  function download(filename, text, format) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename + '.' + format);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function downloadLink(filename, url) {
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('target', '_blank');
    element.setAttribute('download', url);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  function downloadVectorTheme(theme, format) {
    setDownloadFormat(format);

    // Get map layer
    const layer = models.Utils.findOlLayer(mainMap, theme.id);
    
    if (!layer) return null;
    
    const component_cfg = record ? record.config_json : null;

    let features = [];

    let crs = null;
    if (component_cfg && component_cfg.export_crs) {
      crs = component_cfg.export_crs;
    } else if (viewer.config_json && viewer.config_json.export_crs) {
      crs = viewer.config_json.export_crs;    
    } else if (viewer.config_json && viewer.config_json.display_crs) {
      crs = viewer.config_json.display_crs;
    } else {
      crs = 4326;
    }

    features = layer.getSource().getFeatures();

    if (!features || !features.length) return null;

    const parser = new OlFormatGeoJSON();
    const parseOptions = {
      dataProjection: 'EPSG:' + crs,
      featureProjection: mainMap.getView().getProjection().getCode()
    }

    const geojson = parser.writeFeaturesObject(features, parseOptions);

    // Hack: OL does not serialize with CRS attribute
    //json.crs = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4326" } }
    const crsinfo = {
      "type": "name",
      "properties": {
          "name": "urn:ogc:def:crs:EPSG::" + crs
      }
    };
    geojson.crs = crsinfo;    
    const data = JSON.stringify(geojson);    

    if (format == 'geojson') {
      download('export', data, format);     
    } else {
      toast.current.show({
          severity: 'warn', 
          summary: 'Descarregar Tema',
          detail: 'Formato não suportado', life: 3000
      });
    }

    setIsDownloading(false);
  }

  function downloadDatasource(theme, format) {

    let crs = null;
    if (component_cfg && component_cfg.export_crs) {
      crs = component_cfg.export_crs;
    } else if (viewer.config_json && viewer.config_json.export_crs) {
      crs = viewer.config_json.export_crs;    
    } else if (viewer.config_json && viewer.config_json.display_crs) {
      crs = viewer.config_json.display_crs;
    }
    if (crs) {
      crs = 'EPSG:' + crs;
    }

    let params = [
      "SERVICE=WFS",
      "REQUEST=GetFeature",
      "VERSION=" + (datasourceDownload.version || "2.0.0"),
      "typeNames=" + datasourceDownload.typeNames,
      "srsName=" + (datasourceDownload.crs || crs || 'EPSG:4326'),
      "outputFormat=" + (format || "application/json")
    ];
    // Add count
    if (datasourceDownload.count) params.push("count=" + datasourceDownload.count);
    // Add bbox (TODO)
    if (datasourceDownload.bbox) params.push("bbox=" + datasourceDownload.bbox.join(","));
    // Add CQL_FILTER (TODO)
    if (datasourceDownload.cqlFilter) params.push("cql_filter=" + datasourceDownload.cqlFilter)
    // Add propertyName
    if (datasourceDownload.propertyName) params.push("propertyName=" + datasourceDownload.propertyName)
    
    // Build final URL
    let url = datasourceDownload.url + params.join('&');    

    window.open(url, "_blank");
  }

  function downloadTheme(theme, format) {
    if (['WFS', 'KML', 'GML', 'DXF', 'GeoJSON'].includes(theme.type)) {
      downloadVectorTheme(theme, format);
    } else {
      alert("Formato não suportado");
    }
  }

  // Use layers.exclude_components prop to exclude component
  if (layer && layer.exclude_components && layer.exclude_components.includes('LayerDownload')) return null;  

  //Use available export formats/modes to exclude component
  if ((!exportFormats || !exportFormats.length) && !linkDownload && !externalDownload && !datasourceDownload) return null;

  let showDownloadBtn = ['WFS', 'KML', 'GML', 'GeoJSON'].includes(layer.type);
  if (linkDownload || externalDownload || datasourceDownload ) showDownloadBtn = true;

  return (
    <div>
      {showOnPortal(<Toast ref={toast} position="top-right" />)}
      { showDownloadBtn && (
        <div className="p-grid">
            <div className="p-col-4">Descarregar</div>
            <div className="p-col-8">
              { linkDownload &&
                <Button
                  className="p-button-sm p-mr-2 p-mb-2"
                  icon={(isDownloading && downloadFormat=='link') ? "pi pi-spin pi-spinner" : "pi pi-external-link pi"} 
                  label={linkDownload.label || "Abrir"}
                  onClick={e => downloadLink(linkDownload.filename, linkDownload.url)}
                  disabled={isDownloading}
                />
              }
              { externalDownload &&
                <Button
                  className="p-button-sm p-mr-2 p-mb-2"
                  icon={(isDownloading && downloadFormat=='external') ? "pi pi-spin pi-spinner" : "pi pi-external-link pi"} 
                  label={externalDownload.label || "Abrir"}
                  onClick={e => window.open(externalDownload.url, "_blank")}
                  disabled={isDownloading}
                />
              }
              { datasourceDownload ?
                exportFormats.map(opt =>
                  <Button
                      className="p-button-sm p-mr-2 p-mb-2"
                      icon={(isDownloading && downloadFormat==opt.value) ? "pi pi-spin pi-spinner" : "pi pi-file pi"} 
                      label={opt.title}
                      onClick={e => downloadDatasource(layer, opt.outputFormat)}
                      disabled={isDownloading}
                  />) 
                : exportFormats.map(opt =>
                <Button
                    className="p-button-sm p-mr-2 p-mb-2"
                    icon={(isDownloading && downloadFormat==opt.value) ? "pi pi-spin pi-spinner" : "pi pi-file pi"} 
                    label={opt.title}
                    onClick={e => downloadTheme(layer, opt.value)}
                    disabled={isDownloading}
                />
              )}
            </div>
        </div>
      ) }
    </div>  
  )
}
