import {GeoJSON, WFS} from 'ol/format';
import {
  and as andFilter,
  equalTo as equalToFilter,
  like as likeFilter
} from 'ol/format/filter';
import {  isUrlAppOrigin, isUrlAppHostname, 
  getGeometryFieldFromFeatureType, buildSchemaFromFeatureType, buildUiSchemaFromSchema } from './utils';

export const getDescribeFeatureType = (options) => {
  const { cfg, viewer, auth } = options;

  const featureType = `${cfg.feature_prefix}:${cfg.feature_type}`;
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
    url = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(url);
  }

  return fetch(url).then(res => {
    return res.json();
  }).then(result => {
    const sch = buildSchemaFromFeatureType(result.featureTypes[0]);
    const uisch = buildUiSchemaFromSchema(sch);
    const geometry_field = getGeometryFieldFromFeatureType(result.featureTypes[0]);

    const data = {
      schema: sch,
      uischema: uisch,
      geometry_field: geometry_field
    }

    return Promise.resolve(data);    

  }).catch(error => {
    return Promise.reject(error);
  });
};

export const getFeatures = (options) => {

  const {cfg, schema, startIndex, maxFeatures, filter, sort, viewer, auth} = options;

  let url = cfg.source_url + (cfg.source_url.indexOf('?') > -1 ? '' : '?');

  //Add user authentication token
  if (isUrlAppHostname(url) && viewer.integrated_authentication) {
    if (auth && auth.data && auth.data.auth_token) {
      const authkey = viewer?.integrated_authentication_key || 'authkey';
      url = url + '&' + authkey + '=' + auth.data.auth_token;
    }
  }

  if (!isUrlAppOrigin(url)) {
    url = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(url);
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
    fields = Object.keys(cfg.fields_list);
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
          } else {
            conditions.push(likeFilter(key, value, '*', '.','!', false));
          }
        } else {
          conditions.push(likeFilter(key, value, '*', '.','!', false));
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
  return fetch(url, {
    method: 'POST',
    body,
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    const features = new GeoJSON().readFeatures(json);
    return Promise.resolve({features, total: json.totalFeatures}); 
  }).catch(error => {
    return Promise.reject(error);
  });

}


export const getFeatureById = (options) => {

  const { viewer, auth, cfg, featureId, crs = 'EPSG:4326', format = 'application/json'} = options;

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
    url = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(url);
  }

  return fetch(url).then(res => {
    return res.json();
  }).then(result => {
    return Promise.resolve(result);
  }).catch(error => {
    return Promise.reject(error);
  });
}