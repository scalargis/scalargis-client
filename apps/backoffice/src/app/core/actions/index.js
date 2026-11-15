import Cookies from 'universal-cookie'
import { getBackofficeBaseUrl, getAppApiUrl, getCookieAuthName } from '../utils'

export const SITE_LOAD                  = 'SITE_LOAD'

export const AUTH_HTTP_LOADING          = 'AUTH_HTTP_LOADING'
export const AUTH_HTTP_ERROR            = 'AUTH_HTTP_ERROR'
export const AUTH_RESPONSE              = 'AUTH_RESPONSE'
export const AUTH_LOGIN                 = 'AUTH_LOGIN'
export const AUTH_UPDATE                = 'AUTH_UPDATE'

export const BACKOFFICE_LOAD            = 'BACKOFFICE_LOAD'
export const BACKOFFICE_LOAD_DONE       = 'BACKOFFICE_LOAD_DONE'

export const BACKOFFICE_SET_CONFIG      = 'BACKOFFICE_SET_CONFIG'
export const BACKOFFICE_LOAD_ERROR      = 'BACKOFFICE_LOAD_ERROR'
export const BACKOFFICE_NOT_FOUND           = 'BACKOFFICE_NOT_FOUND'
export const BACKOFFICE_NOT_AUTHORIZED      = 'BACKOFFICE_NOT_AUTHORIZED'
export const BACKOFFICE_LOAD_COMPONENTS     = 'BACKOFFICE_LOAD_COMPONENTS'
export const BACKOFFICE_UNLOAD_COMPONENTS   = 'BACKOFFICE_UNLOAD_COMPONENTS'
export const BACKOFFICE_SET_NOTIFICATIONS_TOTAL = 'BACKOFFICE_SET_NOTIFICATIONS_TOTAL'


export const LAYOUT_WRAPPER_CLICK       = 'LAYOUT_WRAPPER_CLICK'
export const LAYOUT_TOGGLE_OVERLAYMENU  = 'LAYOUT_TOGGLE_OVERLAYMENU'
export const LAYOUT_TOGGLE_STATICMENU   = 'LAYOUT_TOGGLE_STATICMENU'
export const LAYOUT_TOGGLE_MOBILEMENU   = 'LAYOUT_TOGGLE_MOBILEMENU'

export const LAYOUT_SET_MODE   = 'LAYOUT_SET_MODE'
export const LAYOUT_SET_COLORMODE   = 'LAYOUT_SET_COLORMODE'


// Get config URL
const CONFIG_URL = import.meta.env.VITE_APP_CONFIG_URL || getAppApiUrl() + '/app/backoffice';
const API_URL = getAppApiUrl();
const cookieAuthName = getCookieAuthName();


export function site_load(core, callback) {
  return async function (dispatch, getState) {
    const url = API_URL + '/app/site/config';

    try {
      await fetch(url, {
          signal: AbortSignal.timeout(10000)
        })
        .then(resp => { 
            return resp.json();
        })
        .then(data => {
          core.setSiteConfig(data);
          callback && callback(data);
        })
        .catch(error => {
          console.log(error);
          callback && callback({});
        });
    } catch (error) {
      // Timeouts if the request takes
      // longer than 10 seconds
      console.log(error);
      callback && callback({});
    }
  }
}


export function login_http_loading() {
  const action = {
    type: AUTH_HTTP_LOADING
  }
  return action;
}

export function login_post(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(login_http_loading());
    
    // Login request
    const options = {
      method: 'POST',
      body: JSON.stringify(post)
    }

    // Auth url. TODO: check for proxy
    const url = API_URL + '/authentication/authenticate';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        //dispatch(login_response(res));
        if (res.authenticated) {
          dispatch(login(res));
          const cookies = new Cookies();
          cookies.set(cookieAuthName, res, { path: '/' });
          if (redirect && history?.navigate) history.navigate(redirect); 
          else window.location.reload();
        } else {
          dispatch(login_http_error({ status: 401, message: 'Nome de Utilizador ou Palavra-passe inválido'}));
        }
      }).catch(error => {
        console.log('error', error);
        dispatch(login_http_error(null));
      });
  }
}

export function refresh_auth(auth) {
  return function (dispatch, getState) {
    const cookies = new Cookies();
    cookies.set(cookieAuthName, auth, { path: '/' });
    dispatch(auth_update(auth));
  }
}

export function logout() {
  return function (dispatch, getState) {
    const cookies = new Cookies();
    cookies.remove(cookieAuthName, { path: '/' });
    window.location.reload();
  }
}

export function login_http_error(res) {
  const action = {
    type: AUTH_HTTP_ERROR,
    res
  }
  return action;
}

export function login_response(res) {
  const action = {
    type: AUTH_RESPONSE,
    res
  }
  return action;
}

export function login(data) {
  const action = {
    type: AUTH_LOGIN,
    data
  }
  return action
}

export function auth_update(data) {
  const action = {
    type: AUTH_UPDATE,
    data
  }
  return action
}

export function backoffice_set_config(config) {
  const action = {
    type: BACKOFFICE_SET_CONFIG,
    config,
    backoffice: config
  }
  return action;
}

export function backoffice_set_notifications_total(total) {
  const action = {
    type: BACKOFFICE_SET_NOTIFICATIONS_TOTAL,
    total
  }
  return action;
}

export function backoffice_load_components(components) {
  const action = {
    type: BACKOFFICE_LOAD_COMPONENTS,
    components
  }
  return action;
}

export function backoffice_unload_components(core) {
  return function (dispatch, getState) {
    core.unloadComponents();
    const action = {
      type: BACKOFFICE_UNLOAD_COMPONENTS
    }
    dispatch(action);
  }
}

/** Error of the backoffice boot, with kind network, server, invalid, unauthorized, or forbidden. */
export class BootError extends Error {
  constructor(kind, status) {
    super(kind);
    this.kind = kind;
    this.status = status;
  }
}

export function backoffice_load_error(error) {
  const action = {
    type: BACKOFFICE_LOAD_ERROR,
    error
  }
  return action;
}

export function backoffice_load_start() {
  const action = {
    type: BACKOFFICE_LOAD
  }
  return action;
}

export function backoffice_not_authorized(history, redirect) {
  const action = {
    type: BACKOFFICE_NOT_AUTHORIZED,
    redirect: redirect ? redirect : '/not-allowed'
  }
  if (action.redirect && history?.navigate) history.navigate(action.redirect)
  return action;
}

export function backoffice_load_done(components) {
  const action = {
    type: BACKOFFICE_LOAD_DONE
  }
  return action;
}

export function backoffice_load(core, history) {
  return function (dispatch, getState) {

    // Get logged user
    const logged = core.getLoggedUser();

    // Fetch backoffice
    const url = CONFIG_URL ? CONFIG_URL : API_URL + '/app/backoffice' + (history.location.search || '');
    
    const options = { headers: {} };
    
    // Add logged user token
    if (logged?.token) options.headers['X-API-KEY'] = logged.token;
    
    dispatch(backoffice_load_start());

    fetch(url, options).catch(() => {
      throw new BootError('network');
    }).then(res => {
      if (res.status === 401) throw new BootError('unauthorized', 401);
      if (res.status === 403) throw new BootError('forbidden', 403);
      if (res.status !== 200) throw new BootError('server', res.status);
      return res.json().catch(() => {
        throw new BootError('invalid', res.status);
      });

    }).then(data => {      
      const config = { ...data, config_json: data?.config };
      delete config.config;

      if (!config.config_json || !Array.isArray(config.config_json.components)) {
        throw new BootError('invalid', 200);
      }

      // Unload components
      dispatch(backoffice_unload_components(core));

      // Setup config
      core.setConfig(config);
      dispatch(backoffice_set_config(config));

      // Load components
      let count = 0;
      const { components } = config.config_json;
      components.forEach(component => {
        core.addComponent(core, component, () => {
          count++;
          if (count === components.length) {

            // Index by id
            const pitems = {};
            components.forEach(c => pitems[c.id] = c);

            // Finally, load into redux store
            dispatch(backoffice_load_components(pitems));
            dispatch(backoffice_load_done());
          }
        })
      })

    }).catch(error => {
      const base_url = getBackofficeBaseUrl();
      const kind = error instanceof BootError ? error.kind : 'invalid';

      if (kind === 'unauthorized' || kind === 'forbidden') {
        if (!logged) history.navigate(`/login?redirect=${base_url}`);
        else dispatch(backoffice_not_authorized(history));
        return;
      }

      if (!(error instanceof BootError)) console.error(error);
      dispatch(backoffice_load_error({ kind, status: error?.status }));
    })
  }
}

export function layout_wrapper_click() {
  const action = {
    type: LAYOUT_WRAPPER_CLICK,
    overlayMenuActive: false,
    mobileMenuActive: false
  }
  return action;
}

export function layout_toggle_overlaymenu() {
  const action = {
    type: LAYOUT_TOGGLE_OVERLAYMENU
  }
  return action;
}

export function layout_toggle_staticmenu() {
  const action = {
    type: LAYOUT_TOGGLE_STATICMENU
  }
  return action;
}

export function layout_toggle_mobilemenu() {
  const action = {
    type: LAYOUT_TOGGLE_MOBILEMENU
  }
  return action;
}

export function layout_toggle_menu(isDesktop) {
  return (dispatch, getState) => {
    if (isDesktop) {
      if (getState().backoffice.layoutMode === 'overlay') {
        dispatch(layout_toggle_overlaymenu());
      } else if (getState().backoffice.layoutMode === 'static') {
        dispatch(layout_toggle_staticmenu())
      }
    } else {
      dispatch(layout_toggle_mobilemenu())
    }
  }
}

export function layout_set_mode(layoutMode) {
  const action = {
    type: LAYOUT_SET_MODE,
    layoutMode
  }
  return action;
}

export function layout_set_colormode(layoutColorMode) {
  const action = {
    type: LAYOUT_SET_COLORMODE,
    layoutColorMode
  }
  return action;
}