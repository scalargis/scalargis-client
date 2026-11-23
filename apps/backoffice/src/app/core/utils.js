const _getAppRootPath = () => {
  if (window?.SCALARGIS_ROOT_PATH !== '__SCALARGIS_ROOT_PATH__') {
    return window?.SCALARGIS_ROOT_PATH || import.meta.env.VITE_APP_ROOT_PATH || '';
  } else {
    return import.meta.env.VITE_APP_ROOT_PATH || '';
  }
}

const _getAppBaseUrl = () => {
  if (window?.SCALARGIS_ROOT_PATH_BASE_URL !== '__SCALARGIS_ROOT_PATH_BASE_URL__') {
    return window?.SCALARGIS_ROOT_PATH_BASE_URL || import.meta.env.VITE_APP_BASE_URL || '';
  } else {
    return import.meta.env.VITE_APP_BASE_URL || '';
  }
}

const _getAppDefaultLocale = () => {
  if (window?.SCALARGIS_DEFAULT_LOCALE !== '__SCALARGIS_DEFAULT_LOCALE__') {
    return window?.SCALARGIS_DEFAULT_LOCALE || import.meta.env.VITE_APP_DEFAULT_LOCALE || '';
  } else {
    return import.meta.env.VITE_APP_DEFAULT_LOCALE || '';
  }
}

/** Removes the integrated authentication token from a URL. */
export const removeAuthToken = (url, authToken) => {
  if (!url || !authToken?.token) return url;
  return url.replace(new RegExp(`([?&])${authToken.param}=${authToken.token}(&|$)`, 'i'), (match, start, end) => end ? start : '');
}

const URL_HISTORY_SIZE = 10;
const urlHistoryKey = (type) => `scalargis_urlhistory_${type}`;

/** Returns the saved service URLs of a wizard type, the last one first. */
export function getUrlHistory(type) {
  try {
    const items = JSON.parse(window.localStorage.getItem(urlHistoryKey(type)) || '[]');
    return Array.isArray(items) ? items.filter(i => typeof i === 'string') : [];
  } catch {
    return [];
  }
}

/** Saves a service URL first in the history of its wizard type. */
export function rememberUrl(type, url, authToken) {
  const clean = removeAuthToken((url || '').trim(), authToken);
  if (!clean) return false;
  try {
    const items = [clean, ...getUrlHistory(type).filter(i => i !== clean)].slice(0, URL_HISTORY_SIZE);
    window.localStorage.setItem(urlHistoryKey(type), JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
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
    params_arr = [];
  const new_params = [],
    queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (let i = params_arr.length - 1; i >= 0; i -= 1) {
      param = params_arr[i].split("=")[0];
      const regex = new RegExp(key, "ig");
      if (!regex.test(param)) {
        new_params.push(params_arr[i]);
      }
    }
    rtn = rtn + "?" + new_params.join("&");
  }
  return rtn;
}

export const getWindowSize = () => {
  const w = window,
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

  const roles = auth?.data?.userroles || [];

  retVal = roles.map(s => s.toLowerCase()).filter(x => ['admin','manager'].includes(x)).length > 0;

  return retVal;
}

/** Returns true when the user has the Admin role. */
export const isAdmin = (auth) => (auth?.data?.userroles || []).some((r) => String(r).toLowerCase() === 'admin');

// -----------------------------------------------------------------------------

export const getAppRootPath = () => {
  return _getAppRootPath();
}

export const getAppBaseUrl = () => {
  const root_path = _getAppRootPath();
  let url = root_path + '';
  if (_getAppBaseUrl()) {
    //url = root_path + _getAppBaseUrl();
    url = _getAppBaseUrl();
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
  //let url = root_path + '/static/backoffice/';
  let url = root_path;
  if (import.meta.env.VITE_APP_CLIENT_URL) {
    url = root_path + import.meta.env.VITE_APP_CLIENT_URL;
  }
  if (!url.endsWith("/")) {
    url += '/';
  }
  return url;
}

export const getAppApiUrl = () => {
  const root_path = _getAppRootPath();
  let url = root_path + '/api';
  if (import.meta.env.VITE_APP_API_URL) {
    url = root_path + import.meta.env.VITE_APP_API_URL;
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
  if (import.meta.env.VITE_APP_MAP_PROXY) {
    url = root_path + import.meta.env.VITE_APP_MAP_PROXY;
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
  if (import.meta.env.VITE_APP_UPLOAD_URL) {
    url = root_path + import.meta.env.VITE_APP_UPLOAD_URL;
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
  return import.meta.env.VITE_APP_COOKIE_AUTH_NAME || 'scalargis_webgis';
}