import React from 'react'
import Core from './Core'
import rootReducer from './core/reducers'
import { getAppRootPath, getAppBaseUrl, getAppClientUrl, getAppApiUrl, getAppMapProxyUrl, getAppUploadUrl, getCookieAuthName } from './core/utils';

const ROOT_PATH = getAppRootPath();
const BASE_URL = getAppBaseUrl();
const CLIENT_URL = getAppClientUrl();
const API_URL = getAppApiUrl();
const MAP_PROXY_URL = getAppMapProxyUrl();
const UPLOAD_URL = getAppUploadUrl();
const COOKIE_AUTH_NAME = getCookieAuthName();
export const core = new Core({ ROOT_PATH, BASE_URL, CLIENT_URL, API_URL, MAP_PROXY_URL, UPLOAD_URL, COOKIE_AUTH_NAME }, rootReducer)

const AppContext = React.createContext();

export default AppContext;