const _getAppRootPath = () => {
  if (window?.SCALARGIS_ROOT_PATH !== '__SCALARGIS_ROOT_PATH__') {
    return window?.SCALARGIS_ROOT_PATH || process.env.REACT_APP_ROOT_PATH || '';
  } else {
    return process.env.REACT_APP_ROOT_PATH || '';
  }
}

const _getAppBaseUrl = () => {
  if (window?.SCALARGIS_ROOT_PATH_BASE_URL !== '__SCALARGIS_ROOT_PATH_BASE_URL__') {
    return window?.SCALARGIS_ROOT_PATH_BASE_URL || process.env.REACT_APP_BASE_URL || '';
  } else {
    return process.env.REACT_APP_BASE_URL || '';
  }
}

const _getAppDefaultLocale = () => {
  if (window?.SCALARGIS_DEFAULT_LOCALE !== '__SCALARGIS_DEFAULT_LOCALE__') {
    return window?.SCALARGIS_DEFAULT_LOCALE || process.env.REACT_APP_DEFAULT_LOCALE || '';
  } else {
    return process.env.REACT_APP_DEFAULT_LOCALE || '';
  }
}

export function rememberUrl(cookies, type, url) {
  const prefix = process.env.REACT_APP_COOKIE_PREFIX || 'sniguserurl';
  const cookieName = prefix + type;
  let urlhistory = cookies.get(cookieName) || [];
  if (urlhistory.indexOf(url) === -1) urlhistory.push(url);
  cookies.set(cookieName, urlhistory);
}

export const  generateRGBA = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return [r, g, b, 1].join(',');
}

export const removeUrlParam = (sourceURL, key) => {
  let rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    new_params = [],
    queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (var i = params_arr.length - 1; i >= 0; i -= 1) {
      param = params_arr[i].split("=")[0];
      let regex = new RegExp(key, "ig");
      if (!regex.test(param)) {
        new_params.push(params_arr[i]);
      }
    }
    rtn = rtn + "?" + new_params.join("&");
  }
  return rtn;
}

export const getWindowSize = () => {
  var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  x = w.innerWidth || e.clientWidth || g.clientWidth,
  y = w.innerHeight|| e.clientHeight|| g.clientHeight;
  return [x, y];
}

export const isUrlAppOrigin = (url) => {
  //Considers it is same origin if is relative path
  if (url.indexOf('http') !== 0) return true;

  //Check if is same origin
  const url1 = new URL(window.location.href);
  const url2 = new URL(url);
  return (url1.origin === url2.origin);
}


export const isAdminOrManager = (auth) => {
  let retVal = false;

  const roles = auth?.data ? (auth.data.userroles || []) : (auth?.response?.userroles || []);

  retVal = roles.map(s => s.toLowerCase()).filter(x => ['admin','manager'].includes(x)).length > 0;

  return retVal;
}

// -----------------------------------------------------------------------------

export const getAppRootPath = () => {
  return _getAppRootPath();
}

export const getAppBaseUrl = () => {
  const root_path = _getAppRootPath();
  let url = root_path + '';
  if (_getAppBaseUrl()) {
    url = root_path + _getAppBaseUrl();
  }
  if (!url.endsWith("/")) {
    url += '/';
  }
  return url;
}

export const getBackofficeBaseUrl = () => {
  const base_path = getAppBaseUrl();
  let url = base_path + 'backoffice';
  if (!url.endsWith("/")) {
    url += '/';
  }
  return url;
}

export const getAppClientUrl = () => {
  const root_path = _getAppRootPath();
  let url = root_path + '/static/backoffice/';
  if (process.env.REACT_APP_CLIENT_URL) {
    url = root_path + process.env.REACT_APP_CLIENT_URL;
  }
  if (!url.endsWith("/")) {
    url += '/';
  }
  return url;
}

export const getAppApiUrl = () => {
  const root_path = _getAppRootPath();
  let url = root_path + '/api';
  if (process.env.REACT_APP_API_URL) {
    url = root_path + process.env.REACT_APP_API_URL;
  }
  if (url.startsWith('//')) {
    url = window.location.protocol + url;
  }
  if (!url.toLowerCase().startsWith('http')) {
    url =  window.location.origin + url;
  }
  return url;
}

export const getAppMapProxyUrl = () => {
  const root_path = _getAppRootPath();
  let url = root_path + '/map/proxy?url=';
  if (process.env.REACT_APP_MAP_PROXY) {
    url = root_path + process.env.REACT_APP_MAP_PROXY;
  }
  if (url.startsWith('//')) {
    url = window.location.protocol + url;
  }
  if (!url.toLowerCase().startsWith('http')) {
    url =  window.location.origin + url;
  }
  return url;
}

export const getAppUploadUrl = () => {
  const root_path = _getAppRootPath();
  let url = '';
  if (process.env.REACT_APP_UPLOAD_URL) {
    url = root_path + process.env.REACT_APP_UPLOAD_URL;
  }
  if (url.startsWith('//')) {
    url = window.location.protocol + url;
  }
  if (!url.toLowerCase().startsWith('http')) {
    url =  window.location.origin + url;
  }
  return url;
}

export const getAppDefaultLocale = () => {
  return _getAppDefaultLocale();
}

export const getCookieAuthName = () => {
  return process.env.REACT_APP_COOKIE_AUTH_NAME || 'scalargis_webgis';
}