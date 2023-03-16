export const isUrlAppOrigin = (url) => {
  //Considers it is same origin if is relative path
  if (url.indexOf('http') !== 0) return true;

  //Check if is same origin
  const url1 = new URL(window.location.href);
  const url2 = new URL(url);
  return (url1.origin === url2.origin);
}

export const isUrlAppHostname = (url) => {
  //Considers it is same origin if is relative path
  if (url.indexOf('http') !== 0) return true;

  //Check if is same origin
  const url1 = new URL(window.location.href);
  const url2 = new URL(url);
  return (url1.hostname === url2.hostname);
}

export const buildSchemaFromFeatureType = (data) => {

  const properties = {};
  
  data.properties.forEach(p => {
    switch (p.localType.toLowerCase()) {
      case 'int':
        properties[p.name] = { type: 'integer' }
        break;
      case 'number': //TODO: use correct field type name
          properties[p.name] = { type: 'number' }
          break;         
      case 'bool':
          properties[p.name] = { type: 'boolean' }
          break;               
      case 'string':
        properties[p.name] = { type: 'string' }
        break;
      default:
    }
  });

  const schema = {
    "type": "object",
    "properties": properties
  }

  return schema;
}

export const buildUiSchemaFromSchema = (schema) => {
  const elements = [];

  Object.entries(schema.properties).forEach(([key, val]) => {
    elements.push({ 
      "type": "Control",
      "scope": `#/properties/${key}`
    });
  });

  const uischema = {
    "type": "VerticalLayout",
    elements
  }  

  return uischema;
}

export const getGeometryFieldFromFeatureType = (data) => {

  let field = null;
  
  data.properties.forEach(p => {
    if (p.localType.toLowerCase() === 'geometry') {
      field = p.name;
    }
  });

  return field;
}