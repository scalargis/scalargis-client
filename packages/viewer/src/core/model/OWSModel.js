import { v4 as uuidv4 } from 'uuid';
import * as OlProj from 'ol/proj';
import OlFormatKML from "ol/format/KML";
import OlFormatGML2 from "ol/format/GML2";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import * as OlExtent from 'ol/extent';
import { generateRGBA, removeUrlParam } from '../utils';
import FileSaver from 'file-saver';
import proj4 from 'proj4';


const getCRSCode = (val) => {

  let retVal = /:(\d+)$/g.exec(val) ? parseInt(/:(\d+)$/g.exec(val)[1], 10) : null;

  if (!retVal) {
    if (val.indexOf('www.opengis.net/def/crs/EPSG') !== -1) {
      retVal = val.substr(val.lastIndexOf('/') + 1);
    }
  }

  return retVal;
}

// Get loaded coordinate systems from server
export const projOptions = (coordsyss) => {
  const options = coordsyss.map(i => ({
    key: ''+i.srid,
    text: i.label,
    value: ''+i.srid,
    extent: i.extent.split(' '),
    defs: i.defs,
    label: i.label,
    label_long: i.label_long,
    labelx: i.labelx,
    labely: i.labely,
    precision: i.precision
  }));
  return options;
}

// Get proj code from COG Image
export const getCOGImageProjCode = (image) => {
  const geoKeys = image.getGeoKeys();
  const {
    ProjectedCSTypeGeoKey
  } = geoKeys;
  // check if projected
  if (typeof ProjectedCSTypeGeoKey === "number" && ProjectedCSTypeGeoKey !== 32767 && ProjectedCSTypeGeoKey <= 32760) {
    return ProjectedCSTypeGeoKey;
  }
  const {
    GeographicTypeGeoKey
  } = geoKeys;
  // check if geographic
  if (typeof GeographicTypeGeoKey === "number" && typeof ProjectedCSTypeGeoKey !== "number") {
    return GeographicTypeGeoKey;
  }
}

/**
 * Create group
 */
export const createGroup = (title, crs, bbox) => {
  const group = {
    type: 'GROUP',
    id: uuidv4(),
    title,
    description: '',
    active: true,
    open: true,
    opacity: 1,
    crs,
    bbox: bbox.join(' '),
    children: []
  };
  return [group];
}

/**
 * Parse BBOX string coordinates
 *
 * @param {Array} bbox
 * @param {String} fromCRS
 * @param {String} toCRS
 * @param {Boolean} inverted
 */
const parseBBOX = (bbox, fromCRS, toCRS, inverted) => {
  let result = [
    parseFloat(bbox[0]),
    parseFloat(bbox[1]),
    parseFloat(bbox[2]),
    parseFloat(bbox[3])
  ];
  if (fromCRS !== toCRS) result = OlProj.transformExtent(bbox, fromCRS, toCRS);
  if (inverted) {
    result = [result[1], result[0], result[3], result[2]];
  }
  return result;
}

const parseInspireMetadata = (metadata) => {
  const result = {};
  if (metadata.MetadataUrl) {
    result['url'] = metadata.MetadataUrl.URL;
    result['media_type'] = metadata.MetadataUrl.MediaType;
  }

  result['language'] = metadata.ResponseLanguage.Language;
  result['supported_languages'] = {
      default: metadata.SupportedLanguages.DefaultLanguage.Language,
      languages: metadata.SupportedLanguages.SupportedLanguage ? metadata.SupportedLanguages.SupportedLanguage.map((l, i) => {
        return l.Language;
      }) : []
    }

  return result;
}

/**
 * Parse WFS to Theme
 *
 * @param {Object} wfs
 * @param {String} originUrl
 * @param {Object} extent
 * @param {Object} options
 */
export const convertWFS2Themes = (wfs, originUrl, options) => {
  let result = [];
  let types = [];
  let bbox;

  // Set default extent from extent options
  if (options.extent) bbox = parseBBOX(options.extent);

  // Find wfs namespace
  let wfsns = wfs['wfs:WFS_Capabilities'] ? 'wfs:' : '';

  // Find ows namespace
  let owsns = wfs[wfsns+'WFS_Capabilities']['ows:ServiceProvider'] ? 'ows:' : '';

  // Find default namespace
  let ns = wfs[wfsns+'WFS_Capabilities'][wfsns+'FeatureTypeList'] ? wfsns : '';

  // Get feature types
  types = wfs[wfsns+'WFS_Capabilities'][ns+'FeatureTypeList'][0][ns+'FeatureType'];



  // Loop through feature types
  types.map((l, i) => {

    // Use default map CRS
    let crs = [null, ''+options.srid];

    // Find WFS version
    let version = wfs[wfsns+'WFS_Capabilities']['$']['version'];

    // Get URL
    let url = originUrl ? originUrl.replace('request=GetCapabilities', '')+'&' : 'wfs_features.xml';
    url = url.replace(/request=getcapabilities/i, '');

    if (url.indexOf('?') < 0) {
      url = url.replace(/&+$/gm,'');
      url += '?';
    }

    // Parse feature for versions 1.0.0 and 1.1.0
    if (['1.0.0', '1.1.0'].indexOf(version) > -1) {

      // Update CRS
      if (l.SRS) crs = getCRSCode(l.SRS[0]) ? parseInt(getCRSCode(l.SRS[0]), 10) : crs; //parseInt(/EPSG:(\d+)/g.exec(l.SRS[0])[1], 10);
      else if (l.DefaultSRS) {
        crs = getCRSCode(l.DefaultSRS[0]) ? parseInt(getCRSCode(l.DefaultSRS[0]), 10): crs; //parseInt(/EPSG::(\d+)/g.exec(l.DefaultSRS[0])[1], 10);
      }

      // Use CRS from DefaultCRS
      if (l[wfsns+'DefaultCRS']) {
        crs = getCRSCode(l[wfsns+'DefaultCRS'][0]) ? parseInt(getCRSCode(l[wfsns+'DefaultCRS'][0]), 10) : crs; //parseInt(/EPSG::(\d+)/g.exec(l[wfsns+'DefaultCRS'][0])[1], 10);
      }

      // Find lat/lon bounding box
      if (l.LatLongBoundingBox) {
        bbox = [
          l.LatLongBoundingBox[0]['$']['minx'],
          l.LatLongBoundingBox[0]['$']['miny'],
          l.LatLongBoundingBox[0]['$']['maxx'],
          l.LatLongBoundingBox[0]['$']['maxx']
        ];
        bbox = parseBBOX(bbox);
      }

      // Use WGS84 boundging box if exists
      if (l[owsns+'WGS84BoundingBox']) {
        bbox = [
          l[owsns+'WGS84BoundingBox'][0][owsns+'LowerCorner'][0].split(' ')[0],
          l[owsns+'WGS84BoundingBox'][0][owsns+'LowerCorner'][0].split(' ')[1],
          l[owsns+'WGS84BoundingBox'][0][owsns+'UpperCorner'][0].split(' ')[0],
          l[owsns+'WGS84BoundingBox'][0][owsns+'UpperCorner'][0].split(' ')[1]
        ];
        bbox = parseBBOX(bbox);
      }

      // Transform BBOX if CRS different that 3857
      /*
      if (crs !== 3857) {
        bbox = parseBBOX(bbox, 'EPSG:' + crs, 'EPSG:3857');
      }
      */
    }

    // Parse feature for versions 2.0.0
    if (version === '2.0.0') {

      // Get CRS from DefaultCRS
      if (l[wfsns+'DefaultCRS']) {
        //crs = /:(\d+)$/g.exec(l[wfsns+'DefaultCRS'][0]) ? parseInt(/:(\d+)$/g.exec(l[wfsns+'DefaultCRS'][0])[1], 10) : crs;
        crs = getCRSCode(l[wfsns+'DefaultCRS'][0]) ? parseInt(getCRSCode(l[wfsns+'DefaultCRS'][0]), 10) : crs;
      } else if (l['DefaultCRS']) {
        //crs = /:(\d+)$/g.exec(l['DefaultCRS'][0]) ? parseInt(/:(\d+)$/g.exec(l['DefaultCRS'][0])[1], 10) : crs;
        crs =  getCRSCode(l['DefaultCRS'][0]) ? parseInt(getCRSCode(l['DefaultCRS'][0]), 10) : crs;
      }

      // Get bounding box from WGS84 bounding box
      if (l[owsns+'WGS84BoundingBox']) {
        crs = 4326;
        bbox = [
          l[owsns+'WGS84BoundingBox'][0][owsns+'LowerCorner'][0].split(' ')[0],
          l[owsns+'WGS84BoundingBox'][0][owsns+'LowerCorner'][0].split(' ')[1],
          l[owsns+'WGS84BoundingBox'][0][owsns+'UpperCorner'][0].split(' ')[0],
          l[owsns+'WGS84BoundingBox'][0][owsns+'UpperCorner'][0].split(' ')[1]
        ];
        bbox = parseBBOX(bbox);
      }

      // Transform BBOX if CRS different that 4326
      if (crs !== 4326) {
        bbox = parseBBOX(bbox, 'EPSG:'+crs, 'EPSG:4326');
        crs = 4326;
      }
    }

    // Create theme object
    const theme = {
      id: uuidv4(),
      title: l[ns+'Title'][0].trim(),
      description: l[ns+'Keywords'] ? l[ns+'Keywords'][0].trim() : '',
      active: false,
      open: false,
      opacity: 1,
      type: "WFS",
      url: url,
      layers: l[ns+'Name'][0],
      servertype: 'mapserver',
      crs,
      tiled: true,
      version: version,
      bbox: bbox.join(' '),
      style_color: generateRGBA(),
      style_stroke_color: generateRGBA(),
      style_stroke_width: 1
    };

    const featureprefix = l[ns+'Name'][0].split(':').length > 1 ? l[ns+'Name'][0].split(':')[0] : '';
    const faturetype = l[ns+'Name'][0].split(':').length > 1 ? l[ns+'Name'][0].split(':')[1] : l[ns+'Name'][0];

    let featurerns = null;

    if (l['$']) {
      featurerns = Object.entries(l['$']).find(([key]) => key.includes('xmlns:' + ns));
    }

    if (!featurerns && wfs[wfsns+'WFS_Capabilities'][ns+'FeatureTypeList']['$']) {
      featurerns = Object.entries(wfs[wfsns+'WFS_Capabilities'][ns+'FeatureTypeList']['$']).find(([key]) => key.includes('xmlns:' + featureprefix));
    }

    if (!featurerns && wfs[wfsns+'WFS_Capabilities']['$']) {
      featurerns = Object.entries(wfs[wfsns+'WFS_Capabilities']['$']).find(([key]) => key.includes('xmlns:' + featureprefix));
    }

    if (featurerns) {
      theme['datatable'] = {
        "source_type": "wfs",
        "source_url": url,
        "feature_namespace": featurerns[1],
        "feature_prefix": featureprefix,
        "feature_type": faturetype,
        "all_geometries": true
      }
    }

    result.push(theme)
    return l;
  });

  return result;
}

/**
 * Parse WMS to Theme
 */
export const convertWMS2Themes = (wms, originUrl, options) => {
  let result = [];

  // Get formats for GetMap request
  let get_map_formats = wms.Capability.Request.GetMap.Format.join(',');
  // Set prefered getMap format
  let get_map_format_preference = [
    'image/png',
    'image/png8',
    'image/png24',
    'image/png32',
    'image/gif',
    'image/jpeg',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ];
  let get_map_format = '';
  if (get_map_formats) {
    let tmformats = get_map_formats.split(',');
    get_map_format_preference.forEach(gmf => {
      if (get_map_format) return;
      if (tmformats.includes(gmf)) get_map_format = gmf;
    });
  }

  // Get formats for GetFeatureInfo request
  let get_feature_info_formats = wms.Capability.Request.GetFeatureInfo.Format.join(',');
  // Set prefered getFeatureInfo format
  let get_feature_info_format_preference = [
    'application/json',
    'application/geojson',
    'application/vnd.ogc.gml',
    'application/vnd.ogc.gml/3.1.1',
    'text/xml; subtype=gml/3.1.1',
    'text/xml',
    'text/html',
    'text/plain'
  ];
  let get_feature_info_format = '';
  if (get_feature_info_formats) {
    let tformats = get_feature_info_formats.split(',');
    get_feature_info_format_preference.forEach(gfif => {
      if (get_feature_info_format) return;
      if (tformats.includes(gfif)) get_feature_info_format = gfif;
    });
  }

  // Set default CRS
  let crs = 4326, bbox, inspire_service_metadata;

  // Get bbox from extent options
  if (options.extent) bbox = parseBBOX(options.extent)

  // Parse INSPIRE Metadata
  if (wms.Capability.Inspire) {
    inspire_service_metadata = parseInspireMetadata(wms.Capability.Inspire);
  }

  // Warn user about different version
  if (options.version
    && (options.version !== "default")
    && (wms.version !== options.version)
  ) {
    throw new Error('O serviço respondeu com a versão ' + wms.version);
  }

  let createThemeFromLayer = (wms, layer, themes) => {

      // Get CRS options
      let crs_options = [];

      if (layer.CRS && layer.CRS.length) {
        crs_options = layer.CRS.filter((v, i, array) => array.indexOf(v) === i);
      } else {
        crs_options = wms.Capability.Layer.CRS.filter((v, i, array) => array.indexOf(v) === i);
      }

      // Get legend URL
      let wms_styles = [];
      let legend_url = '';
      if (layer.Style) {
        if (typeof layer.Style === 'object' && layer.Style.length) {
          layer.Style.map(style => {
            wms_styles.push(style.Name);
            if (!legend_url && typeof style.LegendURL === 'object' && style.LegendURL.length) {
              legend_url = style.LegendURL[0].OnlineResource;
            }
            return style;
          });
        }
      }

      // Parse URL
      let finalUrl = originUrl;

      // Get GetMap URL from GetCapabilities
      if (options.ignore_url) {
        finalUrl = removeUrlParam(finalUrl, 'request');
      } else {
        if (wms.Capability.Request.GetMap.DCPType) {
          wms.Capability.Request.GetMap.DCPType.map(v => {
            if (v.HTTP.Get.OnlineResource) {
              finalUrl = v.HTTP.Get.OnlineResource;
            }
            return v;
          })
        } else {
          if (wms.Service.OnlineResource) finalUrl = wms.Service.OnlineResource;
        }
      }

      // Some services publish wrong URL from GetCapabilities
      if (finalUrl.indexOf('localhost') > -1) finalUrl = originUrl; // Wrong on some services


      // Parse WGS84 bounding box
      if (layer.EX_GeographicBoundingBox && layer.EX_GeographicBoundingBox.length) {
        crs = 4326;
        bbox = parseBBOX(layer.EX_GeographicBoundingBox, 'EPSG:4326', 'EPSG:4326', false)
      } else {
        let findBBOX = []
        if (layer.BoundingBox && layer.BoundingBox.length) {
          findBBOX = layer.BoundingBox.filter(i => i.crs === 'EPSG:4326');
        } else {
          findBBOX = wms.Capability.Layer.BoundingBox.filter(i => i.crs === 'EPSG:4326');
        }
        if (findBBOX.length) {
          crs = 4326;
          bbox = findBBOX[0].extent;
          bbox = parseBBOX(findBBOX[0].extent, 'EPSG:4326', 'EPSG:4326', false)
        }
      }

      // Parse min/max scale
      let source_min_scale = null;
      let source_max_scale = null;
      if (layer.MinScaleDenominator) source_min_scale = layer.MinScaleDenominator;
      if (layer.MaxScaleDenominator) source_max_scale = layer.MaxScaleDenominator;

      // Get Layer INSPIRE Metadata
      let inspire_layer_metadata;
      if (layer.Inspire) {
        inspire_layer_metadata = parseInspireMetadata(layer.Inspire);
      }

      // Build theme object
      const theme = {
        id: uuidv4(),
        title: layer.Title,
        description: layer.Abstract,
        active: false,
        open: false,
        opacity: 1,
        type: 'WMS',
        url: finalUrl,
        layers: layer.Name,
        children: [],
        servertype: options.servertype || undefined,
        crs: crs,
        tiled: typeof options.tiled === 'undefined' ? true : options.tiled,
        version: wms.version,
        crs_options: crs_options.join(','),
        get_map_formats,
        get_map_format: get_map_format || 'image/png',
        get_feature_info_formats,
        get_feature_info_format: get_feature_info_format || 'text/plain',
        wms_styles: wms_styles.join(','),
        wms_style: (wms_styles && wms_styles.length) > 0 ? wms_styles[0] : '',
        legend_url: legend_url,
        bbox: bbox.join(' '),
        source_min_scale,
        source_max_scale,
        inspire_metadata: inspire_layer_metadata || inspire_service_metadata,
        authkey: options.authkey
      }

      // Add theme to parse results
      themes.push(theme);

      // Add sublayers
      if (layer.Layer && layer.Layer.length) {
        layer.Layer.map((l, i) => {
          //createThemeFromLayer(wms, l, themes);
          createThemeFromLayer(wms, l, theme.children);
          return l;
        });
      }

      return theme;
  }

  //wms.Capability.Layer.Layer.map((l, i) => {
  [wms.Capability.Layer].map((l, i) => {
    createThemeFromLayer(wms, l, result);
    return l;
  });

  return result;
}

/**
 * Parse WMTS to Theme
 */
export const convertWMTS2Themes = (wmts, originUrl, options) => {
  let result = [];

  // Set default CRS
  let crs = 4326, bbox, inspire_service_metadata;

  // Set prefered getTile format
  let get_tile_format_preference = [
    'image/png',
    'image/png8',
    'image/png24',
    'image/png32',
    'image/gif',
    'image/jpeg',
    'image/bmp',
    'image/tiff',
    'image/svg-+xml'
  ];

  // Set prefered getFeatureInfo format
  let get_feature_info_format_preference = [
    'application/json',
    'application/geojson',
    'application/vnd.ogc.gml',
    'application/vnd.ogc.gml/3.1.1',
    'text/xml; subtype=gml/3.1.1',
    'text/xml',
    'text/html',
    'text/plain'
  ];

  // Parse URL
  let finalUrl = originUrl;

  // Get GetMap URL from GetCapabilities
  if (options.ignore_url) {
    finalUrl = removeUrlParam(finalUrl, 'request');
  } else {
    if (wmts.OperationsMetadata.GetTile.DCP) {
      wmts.OperationsMetadata.GetTile.DCP.HTTP.Get.map(v => {
        if (v.href) {
          finalUrl = v.href;
        }
        return v;
      })
    }
  }
  // Some services publish wrong URL from GetCapabilities
  if (finalUrl.indexOf('localhost') > -1) finalUrl = originUrl; // Wrong on some services


  //// Get formats for GetFeatureInfo request
  //let get_feature_info_formats = wmts.Capability.Request.GetFeatureInfo.Format.join(',');

  //// Get bbox from extent options
  //if (options.extent) bbox = parseBBOX(options.extent)

  // Parse INSPIRE Metadata
  //if (wmts.Capability.Inspire) {
  //  inspire_service_metadata = parseInspireMetadata(wmts.Capability.Inspire);
  //}

  // Warn user about different version
  if (options.version
    && (options.version !== "default")
    && (wmts.version !== options.version)
  ) {
    throw new Error('O serviço respondeu com a versão ' + wmts.version);
  }

  wmts.Contents.Layer.map((l, i) => {
    //Get tilematrixsets
    let wmts_tilematrixsets = [];
    if (l.TileMatrixSetLink && l.TileMatrixSetLink.length > 0) {
      wmts_tilematrixsets = l.TileMatrixSetLink.map(m => m.TileMatrixSet);
    }

    // Get formats for GetMap request
    let wmts_format = '';
    let wmts_formats = [];
    if (l.Format && l.Format.length > 0) {
      wmts_formats = [...(l.Format)];
    }
    if (wmts_formats.length > 0) {
      get_tile_format_preference.forEach(gtf => {
        if (wmts_format) return;
        if (wmts_formats.includes(gtf)) wmts_format = gtf;
      });
    }

    // Get legend URL
    let wmts_styles = [];
    let legend_url = '';
    if (l.Style) {
      if (typeof l.Style === 'object' && l.Style.length) {
        l.Style.map(style => {
          wmts_styles.push(style.Identifier);
          if (!legend_url && typeof style.LegendURL === 'object' && style.LegendURL.length) {
            legend_url = style.LegendURL[0].href;
          }
          return style;
        });
      }
    }

    //Get FeatureInfo Url
    let get_feature_info_url = finalUrl;

    //Get FeatureInfo formats
    let get_feature_info_format = '';
    let get_feature_info_formats = [];
    if (l.ResourceURL && l.ResourceURL.length > 0) {
      get_feature_info_formats = l.ResourceURL.filter((f => f.resourceType === 'FeatureInfo' ))
        .map(e => e.format);
    }
    if (get_feature_info_formats.length > 0) {
      get_feature_info_format_preference.forEach(gfif => {
        if (get_feature_info_format) return;
        if (get_feature_info_formats.includes(gfif)) get_feature_info_format = gfif;
      });
    }

    // Create theme object
      // Build theme object
      const theme = {
        id: uuidv4(),
        title: l.Title,
        description: l.Abstract,
        active: false,
        open: false,
        opacity: 1,
        type: 'WMTS',
        url: finalUrl,
        layer: l.Identifier,
        version: wmts.version,
        crs: crs,
        bbox: l.WGS84BoundingBox && l.WGS84BoundingBox.length > 0 ? l.WGS84BoundingBox.join(' ') : null,
        servertype: 'mapserver',
        wmts_capabilities: wmts,
        wmts_tilematrixsets: wmts_tilematrixsets.join(','),
        wmts_tilematrixset: l.tilematrixset || 'EPSG:900913',
        wmts_format: wmts_format || 'image/png',
        wmts_formats: wmts_formats.join(','),
        wmts_styles: wmts_styles.join(','),
        wmts_style: '',
        get_feature_info_url: get_feature_info_formats.length > 0 ? get_feature_info_url : null,
        get_feature_info_format: get_feature_info_format || 'text/plain',
        get_feature_info_formats: get_feature_info_formats.join(','),
        legend_url: legend_url
      }

    result.push(theme)
    return l;
  });

  return result;
}

/**
 * Convert KML to themes
 *
 * @param {String} kml
 * @param {String} url
 * @param {String} raw
 * @param {Int} crs
 */
export const convertKML2Themes = (kml, url, raw, crs) => {
  const items = [];
  const parser = new OlFormatKML({extractStyles: false});
  const parseOptions = {
    dataProjection: 'EPSG:' + crs,
    featureProjection: 'EPSG:' + crs
  };
  const features = parser.readFeatures(raw, parseOptions);
  let extent = OlExtent.createEmpty();
  features.map(f => {
    if (f.getGeometry()) OlExtent.extend(extent, f.getGeometry().getExtent());
    return f;
  });
  const bbox = [parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])];
  /*
  const min = OlProj.transform([parseFloat(extent[0]), parseFloat(extent[1])], 'EPSG:4326', 'EPSG:3857');
  const max = OlProj.transform([parseFloat(extent[2]), parseFloat(extent[3])], 'EPSG:4326', 'EPSG:3857');
  const bbox = [min[0], min[1], max[0], max[1]];
  */
  if (kml && kml.kml && kml.kml.Document) {
    const doc = kml.kml.Document[0];
    let name = 'Documento';
    if (doc.name) name = doc.name[0].trim();
    if (doc.Folder) {
      doc.Folder.map((l, i) => {
        items.push({
          id: uuidv4(),
          title: name + ' | ' + l.name[0].trim(),
          description: l.description ? l.description[0].trim() : '',
          active: false,
          open: false,
          opacity: 1,
          type: "KML",
          url: url,
          crs: parseInt(crs, 10),
          crs_options: 'EPSG:' + crs,
          bbox: bbox.join(' '),
          style_color: generateRGBA(),
          style_stroke_color: generateRGBA(),
          style_stroke_width: 1
        })
        return l;
      })
    } else if (doc.name) {
      const name = doc.name[0].trim();
      items.push({
        id: uuidv4(),
        title: name,
        description: doc.description ? doc.description[0].trim() : '',
        active: false,
        open: false,
        opacity: 1,
        type: "KML",
        url: url,
        crs: parseInt(crs, 10),
        crs_options: 'EPSG:' + crs,
        bbox: bbox.join(' '),
        style_color: generateRGBA(),
        style_stroke_color: generateRGBA(),
        style_stroke_width: 1
      })
    } else {
      items.push({
        id: uuidv4(),
        title: name,
        description: '',
        active: false,
        open: false,
        opacity: 1,
        type: "KML",
        url: url,
        crs: parseInt(crs, 10),
        crs_options: 'EPSG:' + crs,
        bbox: bbox.join(' '),
        style_color: generateRGBA(),
        style_stroke_color: generateRGBA(),
        style_stroke_width: 1
      })
    }
  }
  return items;
}

/**
 * Convert GeoJSON file to theme
 */
export const convertGeoJSON2Themes = (geojson, url, name, crs) => {
  const items = [];
  const parser = new OlFormatGeoJSON();
  const parseOptions = {
    dataProjection: 'EPSG:' + crs,
    featureProjection: 'EPSG:' + crs
  };

  const features = parser.readFeatures(geojson, parseOptions);
  let extent = OlExtent.createEmpty();
  features.map(f => {
    if (f.getGeometry()) OlExtent.extend(extent, f.getGeometry().getExtent());
    return f;
  });
  const bbox = [parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])];
  /*
  const min = OlProj.transform([parseFloat(extent[0]), parseFloat(extent[1])], 'EPSG:4326', 'EPSG:3857');
  const max = OlProj.transform([parseFloat(extent[2]), parseFloat(extent[3])], 'EPSG:4326', 'EPSG:3857');
  const bbox = [min[0], min[1], max[0], max[1]];
  */
  items.push({
    id: uuidv4(),
    title: name,
    description: '',
    active: false,
    open: false,
    opacity: 1,
    type: "GeoJSON",
    url: url,
    crs: parseInt(crs, 10),
    crs_options: 'EPSG:' + crs,
    bbox: bbox.join(' '),
    style_color: generateRGBA(),
    style_stroke_color: generateRGBA(),
    style_stroke_width: 1
  });

  return items;
}

export const convertGML2Themes = (gml, url, name, crs) => {
  const items = [];
  const parser = new OlFormatGML2();
  const parseOptions = {
    dataProjection: 'EPSG:' + crs,
    featureProjection: 'EPSG:' + crs
  };
  const features = parser.readFeatures(gml, parseOptions);
  let extent = OlExtent.createEmpty();
  features.map(f => {
    if (f.getGeometry()) OlExtent.extend(extent, f.getGeometry().getExtent());
    return f;
  });
  const bbox = [parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])];
  /*
  const min = OlProj.transform([parseFloat(extent[0]), parseFloat(extent[1])], 'EPSG:3763', 'EPSG:3857');
  const max = OlProj.transform([parseFloat(extent[2]), parseFloat(extent[3])], 'EPSG:3763', 'EPSG:3857');
  const bbox = [min[0], min[1], max[0], max[1]];
  */
  items.push({
    id: uuidv4(),
    title: name,
    description: '',
    active: false,
    open: false,
    opacity: 1,
    type: "GML",
    url: url,
    crs: parseInt(crs, 10),
    crs_options: 'EPSG:' + crs,
    bbox: bbox.join(' '),
    style_color: generateRGBA(),
    style_stroke_color: generateRGBA(),
    style_stroke_width: 1
  });
  return items;
}

/**
 * Download theme
 *
 * @param {Object} theme
 * @param {String} format
 */
export const downloadTheme = (theme, format) => {
  const endpoint = process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_PUBLIC_URL;

  if (['KML', 'GML', 'GeoJSON'].indexOf(theme.type) > -1) {

    // Convert file
    const filename = theme.url.substring(theme.url.lastIndexOf('/')+1);
    const url = endpoint + '/convert/' + filename + '/' + format
    fetch(url, { responseType: 'blob' })
      .then(res => res.blob())
      .then(res => {

        // Download result
        FileSaver.saveAs(res, format)
      }).catch((error) => {
        console.error(error);
      });
  }

  if (['WFS'].indexOf(theme.type) > -1) {

    // Get WFS data
    const formatOutput = (['1.0.0', '1.1.0'].indexOf(theme.version) > -1 ? 'GML2' : 'GML3');
    let url = theme.url
    url = url.replace(/&$/ig, '')
    url = url + (url.indexOf('?') > -1 ? '' : '?')
      + '&service=WFS&'
      + 'version=' + theme.version
      + '&request=GetFeature'
      + '&typename=' + encodeURIComponent(theme.layers)
      + '&outputFormat=' + formatOutput
      + '&srsname=EPSG:' + theme.crs;
    fetch(url, { responseType: 'blob'})
    .then(res => res.blob())
    .then(res => {

      // Upload data
      const upload = new FormData();
      upload.append('upload', res);
      upload.append('ext', 'xml');
      fetch(endpoint + '/resource', { method: 'POST', body: upload })
      .then(res => res.json())
      .then(res => {
        if (!res.success) {
          console.log(res.error);
          return;
        }

        // Convert to format
        const url = endpoint + '/convert/' + res.filename + '/' + format
        fetch(url, { responseType: 'blob' })
          .then(res => res.blob())
          .then(res => {

            // Download result
            FileSaver.saveAs(res, format)
          }).catch((error) => {
            console.error(error);
          });
      });
    });
  }
}


/**
 * Parse WMS to Theme
 */
 export const convertArcGISMap2Themes = (capabilities, originUrl, options) => {
  let result = [];

  const service = capabilities.service;
  const layers = capabilities.layers;

  // Get formats for GetMap request
  let get_map_formats = service.supportedImageFormatTypes;
  // Set prefered getMap format
  let get_map_format_preference = [
    'PNG32',
    'PNG24',
    'PNG',
    'JPG',
    'DIB',
    'TIFF',
    'EMF',
    'PS',
    'PDF',
    'GIF',
    'SVG',
    'SVGZ',
    'BMP'
  ];
  let get_map_format = '';
  if (get_map_formats) {
    let tmformats = get_map_formats.split(',');
    get_map_format_preference.forEach(gmf => {
      if (get_map_format) return;
      if (tmformats.includes(gmf)) get_map_format = gmf;
    });
  }

  // Set default CRS
  let crs = 4326, bbox;

  try {
    // Get bbox from extent options
    const extent = service.fullExtent;
    if (extent && extent.xmin && extent.ymin && extent.xmax && extent.ymax) {
      //console.log(OlProj.get(`EPSG:${extent.spatialReference.wkid}`));
      if (extent.spatialReference.wkid && OlProj.get(`EPSG:${extent.spatialReference.wkid}`)) {
        bbox = parseBBOX([extent.xmin, extent.ymin, extent.xmax, extent.ymax], `EPSG:${extent.spatialReference.wkid}`, `EPSG:${crs}`);
      } else if (extent.spatialReference.wkt) {
        const min = proj4(extent.spatialReference.wkt,'EPSG:4326', [extent.xmin, extent.ymin]);
        const max = proj4(extent.spatialReference.wkt,'EPSG:4326', [extent.xmax, extent.ymax]);
        bbox = [...min, ...max];
      }
    }
  } catch(e) {
    console.log(e);
  }


  let createThemeFromLayer = (capabilities, layer, themes) => {

      // Get CRS options
      const crs_options = ['EPSG:4326', 'EPSG:3857'];
      if (service?.spatialReference?.wkid) {
        crs_options.push(`EPSG:${service.spatialReference.wkid}`);
      }
      if (layer.sourceSpatialReference && !crs_options.includes(`EPSG:${layer.sourceSpatialReference.wkid}`)) {
        crs_options.push(`EPSG:${layer.sourceSpatialReference.wkid}`);
      }

      // Parse URL
      let finalUrl = originUrl;

      let layer_crs = crs;
      let layer_bbox = bbox;

      try {
        const extent = layer.extent;
        if (extent && extent.xmin && extent.ymin && extent.xmax && extent.ymax) {
          if (extent.spatialReference.wkid && OlProj.get(`EPSG:${extent.spatialReference.wkid}`)) {
            layer_bbox = parseBBOX([extent.xmin, extent.ymin, extent.xmax, extent.ymax], `EPSG:${extent.spatialReference.wkid}`, `EPSG:${crs}`);
          } else if (extent.spatialReference.wkt) {
            const min = proj4(extent.spatialReference.wkt,'EPSG:4326', [extent.xmin, extent.ymin]);
            const max = proj4(extent.spatialReference.wkt,'EPSG:4326', [extent.xmax, extent.ymax]);
            layer_bbox = [...min, ...max];
          }
        }
      } catch (e) {
        console.log(e);
      }

      // Parse min/max scale
      const source_min_scale = layer.maxScale != null ? layer.maxScale : null;
      const source_max_scale = layer.minScale != null ? layer.minScale : null;

      // Build theme object
      const theme = {
        id: uuidv4(),
        title: layer.name,
        description: layer.description,
        active: false,
        open: false,
        opacity: 1,
        type: 'ArcGISMap',
        url: finalUrl,
        layers: !layer.subLayers || !layer.subLayers.length ? `show:${layer.id}` : null,
        layerId: [layer.id],
        children: [],
        servertype: 'arcgismap',
        crs: layer_crs,
        tiled: typeof options.tiled === 'undefined' ? true : options.tiled,
        get_feature_info_layers: `visible:${layer.id}`,
        crs_options: crs_options.length ? crs_options.join(',') : null,
        bbox: (layer_bbox && layer_bbox.length) ? layer_bbox.join(' ') : null,
        source_min_scale,
        source_max_scale,
        //authkey: options.authkey
      }

      // Add theme to parse results
      themes.push(theme);

      // Add sublayers
      if (layer.subLayers && layer.subLayers.length) {
        layer.subLayers.map((l, i) => {
          const child_layer = capabilities.layers.filter(cl => cl.id === l.id)[0];
          createThemeFromLayer(capabilities, child_layer, theme.children);
          return l;
        });
      }

      return theme;
  }

  layers.filter(l=>!l.parentLayer).map((l, i) => {
    createThemeFromLayer(capabilities, l, result);
    return l;
  });

  return result;
}


/**
 * Parse COG to Theme
 */
export const convertCOG2Themes = (image, url, name, options) => {
  let result = [];

  const bbox = image.getBoundingBox();
  const bands = image.getSamplesPerPixel();
  const nodata = undefined;
  const crs = getCOGImageProjCode(image);
  const projection = `EPSG:${crs}`;

  // Create theme object
  // Build theme object
  const theme = {
    id: uuidv4(),
    title: name,
    description: '',
    active: false,
    open: false,
    opacity: 1,
    type: "COG",
    url: url,
    crs: parseInt(crs, 10),
    crs_options: projection,
    bbox: bbox.join(' '),
    options
  }

  result.push(theme);

  return result;
}


export default {
  projOptions,
  getCOGImageProjCode,
  convertWFS2Themes,
  convertWMS2Themes,
  convertWMTS2Themes,
  convertArcGISMap2Themes,
  convertKML2Themes,
  convertGeoJSON2Themes,
  convertGML2Themes,
  convertCOG2Themes,
  createGroup
}
