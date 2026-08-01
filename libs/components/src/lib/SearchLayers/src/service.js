import {GeoJSON, WFS} from 'ol/format';
import {
  and as andFilter,
  equalTo as equalToFilter,
  like as likeFilter
} from 'ol/format/filter';
import {  isUrlAppOrigin, isUrlAppHostname,
  getGeometryFieldFromFeatureType, buildSchemaFromFeatureType, buildUiSchemaFromSchema } from './utils';

// A fetch that fails loudly instead of hanging or feeding malformed HTML to
// JSON.parse: it aborts after a timeout, and rejects on a non-OK status or a
// non-JSON body BEFORE .json() throws a bare SyntaxError. The thrown Error
// reaches SearchLayerForm's .catch (the notification) and .finally (which drops
// the LoadingOverlay) — without this a mis-serving WFS left the panel blocked.
const REQUEST_TIMEOUT_MS = 30000;

async function fetchJson(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    throw err?.name === 'AbortError'
      ? new Error('O serviço de pesquisa demorou demasiado a responder.')
      : err;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`O serviço de pesquisa respondeu com o estado ${response.status}.`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    throw new Error('O serviço de pesquisa não devolveu JSON (verifique a configuração da camada).');
  }
  return response.json();
}

export const getDescribeFeatureType = async (options) => {
  const { core, cfg, viewer, auth } = options;

  const featureType = cfg.feature_prefix ? `${cfg.feature_prefix}:${cfg.feature_type}` : cfg.feature_type;
  let url = cfg.source_url + (cfg.source_url.indexOf('?') > -1 ? '' : '?');
  url = `${url}&service=WFS&version=2.0.0&request=DescribeFeatureType&typeName=${featureType}&outputFormat=application/json`

  //Add user authentication token
  if (isUrlAppHostname(url) && viewer.integrated_authentication) {
    if (auth && auth.data && auth.data.auth_token) {
      const authkey = viewer?.integrated_authentication_key || 'authkey';
      url = url + '&' + authkey + '=' + auth.data.auth_token;
    }
  }

  if (!isUrlAppOrigin(url)) {
    url = core.MAP_PROXY_URL + encodeURIComponent(url);
  }

  const result = await fetchJson(url);

  const sch = buildSchemaFromFeatureType(result.featureTypes[0]);
  const uisch = buildUiSchemaFromSchema(sch);
  const geometry_field = getGeometryFieldFromFeatureType(result.featureTypes[0]);

  return {
    schema: sch,
    uischema: uisch,
    geometry_field: geometry_field
  };
};

export const getFeatures = async (options) => {

  const {core, cfg, schema, startIndex, maxFeatures, filter, sort, viewer, auth} = options;

  // Guard the feature type BEFORE writeGetFeature. new WFS().writeGetFeature()
  // reads featureType.geometryName synchronously (below), so a missing/blank
  // feature_type throws a bare TypeError there — and because that throw is
  // synchronous inside this promise-returning function, without this guard it
  // escaped the .then chain entirely: neither .catch nor .finally ran and the
  // panel's LoadingOverlay stayed up for good. As an async function now, the
  // throw becomes a rejection the caller can handle.
  if (!cfg.feature_type || typeof cfg.feature_type !== 'string') {
    throw new Error('Configuração de pesquisa inválida: falta o feature_type da camada.');
  }

  let url = cfg.source_url + (cfg.source_url.indexOf('?') > -1 ? '' : '?');

  //Add user authentication token
  if (isUrlAppHostname(url) && viewer.integrated_authentication) {
    if (auth && auth.data && auth.data.auth_token) {
      const authkey = viewer?.integrated_authentication_key || 'authkey';
      url = url + '&' + authkey + '=' + auth.data.auth_token;
    }
  }

  if (!isUrlAppOrigin(url)) {
    url = core.MAP_PROXY_URL + encodeURIComponent(url);
  }

  const requestOptions = {
    srsName: 'EPSG:4326',
    featureNS: cfg.feature_namespace,
    featurePrefix: cfg.feature_prefix,
    featureTypes: [cfg.feature_type],
    outputFormat: 'application/json'
    //startIndex,
    //maxFeatures,
    //sortBy: 'distrito+D',
    /*
    filter: andFilter(
      likeFilter('code', '08*'),
      equalToFilter('unity', 'conc')
    )
    */
  }

  if (startIndex != null) {
    requestOptions["startIndex"] = startIndex;
  }
  if (maxFeatures != null) {
    requestOptions["maxFeatures"] = maxFeatures;
  }
  
  let fields = null;
  if (cfg.fields_list && Object.keys(cfg.fields_list).length > 0) {
    fields = [];
    for (const [key, fld] of Object.entries(cfg.fields_list)) {
      if (fld.fields) {
        if (Array.isArray(fld.fields)) {
          fields = [...new Set([...fields, ...fld.fields])];
        } else {
          if (!fields.includes(fld.fields)) fields.push(fld.fields);
        }
      } else {
        fields.push(key);
      }
    }
  } else if (schema && schema.properties && Object.keys(schema.properties).length > 0) {
    fields = Object.keys(schema.properties);
  }
  if (fields) {
    if (cfg.all_geometries === true && cfg.geometry_field) {
      if (Object.keys(fields).indexOf(cfg.geometry_field) === -1) fields.push(cfg.geometry_field);
    }
    requestOptions['propertyNames'] = fields;
  }

  if (filter && Object.keys(filter).length > 0) {
    const conditions =[];
    Object.entries(filter).forEach(([key, value]) => {
      if (value) {
        if (schema && schema.properties && schema.properties[key]) {
          if (schema.properties[key].type === 'integer') {
            conditions.push(equalToFilter(key, value));
          } else if (schema.properties[key].type === 'number') {
            conditions.push(equalToFilter(key, value));
          } else {
            // Wrap in wildcards so a bare term is a case-insensitive "contains"
            // (matchCase already false). NOTE: shared with snic3/mapaspt — this
            // widens their search semantics too. singleChar '.' / escapeChar '!'
            // already read a dotted value as a pattern; wrapping only broadens.
            conditions.push(likeFilter(key, `*${value}*`, '*', '.','!', false));
          }
        } else {
          // Same wildcard "contains" as above, for fields with no schema type.
          conditions.push(likeFilter(key, `*${value}*`, '*', '.','!', false));
        }
      }
    });

    let wfsFilter = null;
    if (conditions.length === 1) {
      wfsFilter = conditions[0];
    } else if (conditions.length > 1) {
      wfsFilter = andFilter(...conditions);
    }

    if (wfsFilter) {
      requestOptions['filter'] = wfsFilter;
    }
  }

  // generate a GetFeature request
  const featureRequest = new WFS().writeGetFeature(requestOptions);
  const ogcNS = 'http://www.opengis.net/ogc';
  featureRequest.setAttribute('xmlns:ogc', ogcNS);

  const xmlSerializer = new XMLSerializer();
  
  let body = xmlSerializer.serializeToString(featureRequest);

  let new_sort = null;
  if (sort && Object.keys(sort).length > 0) {
    new_sort = {...sort};
  } else if (cfg.sort && Object.keys(cfg.sort).length > 0) {
    new_sort = {...cfg.sort}
  }
  if(new_sort && Object.keys(new_sort).length > 0) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(body, 'text/xml');
    const parent = xmlDoc.getElementsByTagName("Query")[0];

    const sortElem = xmlDoc.createElementNS(ogcNS, 'ogc:SortBy');

    Object.entries(new_sort).forEach(([key, value]) => {
      const sortPropertyElem = xmlDoc.createElementNS(ogcNS, 'ogc:SortProperty');
    
      const propertyNameElem = xmlDoc.createElementNS(ogcNS, 'ogc:PropertyName');
      propertyNameElem.appendChild(xmlDoc.createTextNode(key));
  
      const sortOrderElem = xmlDoc.createElementNS(ogcNS, 'ogc:SortOrder');
      sortOrderElem.appendChild(xmlDoc.createTextNode(value));
  
      sortPropertyElem.appendChild(propertyNameElem);
      sortPropertyElem.appendChild( sortOrderElem);

      sortElem.appendChild(sortPropertyElem);
    })

    parent.appendChild(sortElem);
    body = xmlSerializer.serializeToString(xmlDoc);

  }

  // then post the request and add the received features to a layer
  const json = await fetchJson(url, { method: 'POST', body });
  const features = new GeoJSON().readFeatures(json);
  return {features, total: json.totalFeatures || json?.features?.length};
}


export const getFeatureById = async (options) => {

  const { core, viewer, auth, cfg, featureId, crs = 'EPSG:4326', format = 'application/json'} = options;

  let url = cfg.source_url;
  url += url.indexOf('?') < 0 ? '?' : '';
  url += '&service=WFS';
  url += '&request=GetFeature';
  url += '&typeNames=' + (cfg.feature_prefix ? cfg.feature_prefix + ':' +  cfg.feature_type : cfg.feature_type);
  url += '&featureID=' + featureId;
  url += '&srsName=' + crs;
  url += '&outputFormat=' + format;

  //Add user authentication token
  if (isUrlAppHostname(url) && viewer.integrated_authentication) {
    if (auth && auth.data && auth.data.auth_token) {
      const authkey = viewer?.integrated_authentication_key || 'authkey';
      url = url + '&' + authkey + '=' + auth.data.auth_token;
    }
  }

  if (!isUrlAppOrigin(url)) {
    url = core.MAP_PROXY_URL + encodeURIComponent(url);
  }

  return fetchJson(url);
}