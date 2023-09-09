import React from 'react';
import { Map, View } from 'ol';
import OlCollection from 'ol/Collection';
import Core from './Core';
import rootReducer from './core/reducers';
import { 
  getAppRootPath,
  getAppBaseUrl,
  getAppClientUrl,
  getAppApiUrl,
  getAppMapProxyUrl,
  getAppUploadUrl,
  getAppDefaultLocale,
  getCookieAuthName
} from './core/utils';

const ROOT_PATH = getAppRootPath();
const BASE_URL = getAppBaseUrl();
const CLIENT_URL = getAppClientUrl();
const API_URL = getAppApiUrl();
const MAP_PROXY_URL = getAppMapProxyUrl();
const UPLOAD_URL = getAppUploadUrl();
const DEFAULT_LOCALE = getAppDefaultLocale();
const COOKIE_AUTH_NAME = getCookieAuthName();
export const core = new Core({
  ROOT_PATH,
  BASE_URL,
  CLIENT_URL,
  API_URL,
  MAP_PROXY_URL,
  UPLOAD_URL,
  DEFAULT_LOCALE,
  COOKIE_AUTH_NAME
}, rootReducer);

let options = {
  controls: new OlCollection(),
  interactions: new OlCollection(),
  view: new View({
    center: [-878528, 4465088],
    zoom: 12,
    //rotation: -Math.PI / 8
  })
};
export const mainMap = new Map(options);

const AppContext = React.createContext();

export default AppContext;