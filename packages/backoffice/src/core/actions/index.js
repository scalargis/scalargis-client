import Cookies from 'universal-cookie'
import { getAppApiUrl, getCookieAuthName } from '../utils'

export const AUTH_HTTP_LOADING          = 'AUTH_HTTP_LOADING'
export const AUTH_HTTP_ERROR            = 'AUTH_HTTP_ERROR'
export const AUTH_RESPONSE              = 'AUTH_RESPONSE'
export const AUTH_LOGIN                 = 'AUTH_LOGIN'

export const BACKOFFICE_LOAD            = 'BACKOFFICE_LOAD'
export const BACKOFFICE_LOAD_DONE       = 'BACKOFFICE_LOAD_DONE'

export const BACKOFFICE_SET_CONFIG      = 'BACKOFFICE_SET_CONFIG'
export const BACKOFFICE_LOAD_ERROR      = 'BACKOFFICE_LOAD_ERROR'
export const BACKOFFICE_NOT_FOUND           = 'BACKOFFICE_NOT_FOUND'
export const BACKOFFICE_NOT_AUTHORIZED      = 'BACKOFFICE_NOT_AUTHORIZED'
export const BACKOFFICE_LOAD_COMPONENTS     = 'BACKOFFICE_LOAD_COMPONENTS'
export const BACKOFFICE_UNLOAD_COMPONENTS   = 'BACKOFFICE_UNLOAD_COMPONENTS'


export const LAYOUT_WRAPPER_CLICK       = 'LAYOUT_WRAPPER_CLICK'
export const LAYOUT_TOGGLE_OVERLAYMENU  = 'LAYOUT_TOGGLE_OVERLAYMENU'
export const LAYOUT_TOGGLE_STATICMENU   = 'LAYOUT_TOGGLE_STATICMENU'
export const LAYOUT_TOGGLE_MOBILEMENU   = 'LAYOUT_TOGGLE_MOBILEMENU'

export const LAYOUT_SET_MODE   = 'LAYOUT_SET_MODE'
export const LAYOUT_SET_COLORMODE   = 'LAYOUT_SET_COLORMODE'


// Get config URL
const CONFIG_URL = process.env.REACT_APP_CONFIG_URL || getAppApiUrl() + '/app/backoffice';
const API_URL = getAppApiUrl();
const cookieAuthName = getCookieAuthName();


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
    let options = {
      method: 'POST',
      body: JSON.stringify(post)
    }

    // Auth url. TODO: check for proxy
    let url = API_URL + '/authentication/authenticate';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        dispatch(login_response(res));
        if (res.authenticated) {
          const cookies = new Cookies();
          cookies.set(cookieAuthName, res, { path: '/' });
          if (redirect && history) history.push({ pathname: redirect }); 
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

export function logout() {
  const cookies = new Cookies();
  cookies.remove(cookieAuthName, { path: '/' });
  window.location.reload();
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

export function backoffice_set_config(config) {
  const action = {
    type: BACKOFFICE_SET_CONFIG,
    config,
    backoffice: config
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

export function backoffice_error(history) {
  const action = {
    type: BACKOFFICE_LOAD_ERROR,
    redirect: '/not-found'
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
  return action;
}

export function backoffice_not_found(history) {
  const action =  {
    type: BACKOFFICE_NOT_FOUND,
    redirect: '/not-found'
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
  return action;
}


export function backoffice_not_authorized(history, redirect) {
  const action = {
    type: BACKOFFICE_NOT_AUTHORIZED,
    redirect: redirect ? redirect : '/not-allowed'
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
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
    const cookies = new Cookies();
    const logged = cookies.get(cookieAuthName);
    
    // Fetch backoffice
    let url = CONFIG_URL ? CONFIG_URL : API_URL + '/app/backoffice' + (history.location.search || '');
    
    const options = { headers: {} };
    
    // Add logged user token
    if (logged) options.headers['X-API-KEY'] = logged.token;
    
    // Make request
    fetch(url, options).then(res => {

      // Validate response
      if (res.status === 401) throw new Error('Unauthorized');
      else if (res.status !== 200) throw new Error('Not found');
      return res.json();
      
    }).then(data => {      
      const config = { ...data, config_json: data.config };
      delete config.config;

      // Validate config
      if (!config) return dispatch(backoffice_not_found(history));
      if (!config.config_json) return dispatch(backoffice_not_found(history));

      // Unload components
      dispatch(backoffice_unload_components(core));

      // Setup config
      core.setConfig(config);
      dispatch(backoffice_set_config(config));

      // Load components
      let count = 0;
      let { components } = config.config_json;
      components.forEach(component => {
        core.addComponent(core, component, () => {
          count++;
          if (count === components.length) {

            // Index by id
            let pitems = {};
            components.forEach(c => pitems[c.id] = c);

            // Finally, load into redux store
            dispatch(backoffice_load_components(pitems));
            dispatch(backoffice_load_done());
          }
        })
      })

    }).catch(error => {

      // Redirect to login or error pages
      if (error.message === 'Unauthorized') {
        if (!logged) {
          //const redirect = 'login?redirect=' + (id || '/');
          const redirect = '/login?redirect=/';
          history.push(redirect);
        } else dispatch(backoffice_not_authorized(history));
      } else dispatch(logout());  //dispatch(backoffice_not_authorized(history));
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
  let action = {
    type: LAYOUT_SET_MODE,
    layoutMode
  }
  return action;
}

export function layout_set_colormode(layoutColorMode) {
  let action = {
    type: LAYOUT_SET_COLORMODE,
    layoutColorMode
  }
  return action;
}