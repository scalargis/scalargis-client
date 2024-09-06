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

export const getWindowSize = () => {
    var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    return [x, y];
  }
  
  export const isDesktop = () => {
    return window.innerWidth > 1024;
  }
  
  export const isMobile = () => {
    const wsize = getWindowSize();
    const isMobile = wsize[0] <= 768;
  
    return isMobile;
  }

  export const isMobileSmall = () => {
    const wsize = getWindowSize();
    const isMobileSmall = wsize[0] <= 440;

    return isMobileSmall;
  }
  
  export const isRelativePath = (path) => !/^([a-z]+:)?[\\/]/i.test(path);
  
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
  
  export const getAppClientUrl = () => {
    const root_path = _getAppRootPath();
    let url = root_path + '/static/viewer/';
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
  
  export const getViewerPublicUrl = (uuid) => {
      const appUrl = new URL(window.location.href.toLowerCase());
      let viewerPath = 'map/';
      if (appUrl.pathname.startsWith(getAppBaseUrl())) {
        let tmpPath = appUrl.pathname.substring(getAppBaseUrl().length);
        if (tmpPath.indexOf('/') > -1) {
          tmpPath = tmpPath.substring(0, tmpPath.indexOf('/'));
          if (!tmpPath.endsWith("/")) {
            tmpPath += '/';
          }
          viewerPath = tmpPath;
        }
      }
      return appUrl.origin + getAppBaseUrl() + viewerPath + uuid;
  }
  
  export const buildRelativeUrlPath = (path) => {
    if (!/^([a-z]+:)?[\\/]/i.test(path)) {
      return getAppClientUrl() + path;
    }
  
    if (/^\/[^/]/i.test(path)) {
      return getAppRootPath() + path;
    }
  
    return path;
  }

  export const buildUrlPath = (path, relativePath = "") => {

    let url = path;

    if (url.toLowerCase().startsWith('http') || url.startsWith('//')) {
      return url; 
    }

    if (isRelativePath(url)) {
      if (!relativePath) return url;
      
      url =  relativePath + (relativePath.endsWith("/") ? "" : "/") + path;
      return url;
    }

    let baseUrl = _getAppBaseUrl();
    baseUrl = ("" ? baseUrl.startsWith("/") : "/") + baseUrl;  
    url = baseUrl + url;
    
    return url;
  }
  