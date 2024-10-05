import { transformExtent } from "../model/MapModel"
import Cookies from 'universal-cookie'


import { i18n as i18nUtils } from '@scalargis/components'
import { isUrlAppOrigin, getAppApiUrl, getAppMapProxyUrl, getCookieAuthName } from '../utils'
import { isThemeOnScale as isThemeOnScaleMapModel } from '../model/MapModel'
import { loadTranslations } from "../i18n"


export const SITE_LOAD                  = 'SITE_LOAD'

export const AUTH_HTTP_LOADING          = 'AUTH_HTTP_LOADING'
export const AUTH_HTTP_ERROR            = 'AUTH_HTTP_ERROR'
export const AUTH_CLEAR_ERROR           = 'AUTH_CLEAR_ERROR'
export const AUTH_RESPONSE              = 'AUTH_RESPONSE'
export const AUTH_LOGIN                 = 'AUTH_LOGIN'

export const PASSWORD_HTTP_LOADING      = 'PASSWORD_HTTP_LOADING'
export const PASSWORD_HTTP_ERROR        = 'PASSWORD_HTTP_ERROR'
export const PASSWORD_RESPONSE          = 'PASSWORD_RESPONSE'

export const REGISTRATION_HTTP_LOADING  = 'REGISTRATION_HTTP_LOADING'
export const REGISTRATION_HTTP_ERROR    = 'REGISTRATION_HTTP_ERROR'
export const REGISTRATION_RESPONSE      = 'REGISTRATION_RESPONSE'

export const VIEWER_LOAD                = 'VIEWER_LOAD'
export const VIEWER_LOAD_DONE           = 'VIEWER_LOAD_DONE'
export const VIEWER_SAVE_HTTP_LOADING   = 'VIEWER_SAVE_HTTP_LOADING'
export const VIEWER_SAVE_HTTP_ERROR     = 'VIEWER_SAVE_HTTP_ERROR'
export const VIEWER_SAVE_RESPONSE       = 'VIEWER_SAVE_RESPONSE'

export const VIEWER_SESSION_LOAD        = 'VIEWER_SESSION_LOAD'
export const VIEWER_SESSION_SAVED       = 'VIEWER_SESSION_SAVED'

export const VIEWER_SET_CONFIG          = 'VIEWER_SET_CONFIG'
export const VIEWER_LOAD_ERROR          = 'VIEWER_LOAD_ERROR'
export const VIEWER_NOT_FOUND           = 'VIEWER_NOT_FOUND'
export const VIEWER_NOT_AUTHORIZED      = 'VIEWER_NOT_AUTHORIZED'
export const VIEWER_LOAD_COMPONENTS     = 'VIEWER_LOAD_COMPONENTS'
export const VIEWER_UNLOAD_COMPONENTS   = 'VIEWER_UNLOAD_COMPONENTS'
export const VIEWER_SET_SELECTEDMENU    = 'VIEWER_SET_SELECTEDMENU'
export const VIEWER_SET_LOCALE          = 'VIEWER_SET_LOCALE'
export const VIEWER_SET_FEATUREINFO     = 'VIEWER_SET_FEATUREINFO'
export const VIEWER_SET_GEOLOCATION     = 'VIEWER_SET_GEOLOCATION'
export const VIEWER_SET_DRAWINGS        = 'VIEWER_SET_DRAWINGS'
export const VIEWER_SET_COORDINATES     = 'VIEWER_SET_COORDINATES'

export const MAP_SET_EXTENT             = 'MAP_SET_EXTENT'
export const MAP_SET_SIZE               = 'MAP_SET_SIZE'
export const MAP_SET_CLASS              = 'MAP_SET_CLASS'

export const LAYERS_SET_CHECKED         = 'LAYERS_SET_CHECKED'
export const LAYERS_SET_OPENED          = 'LAYERS_SET_OPENED'
export const LAYERS_UPDATE_THEME        = 'LAYERS_UPDATE_THEME'
export const LAYERS_REMOVE_ITEMS        = 'LAYERS_REMOVE_ITEMS'
export const VIEWER_SET_DISPLAYCRS      = 'VIEWER_SET_DISPLAYCRS'
export const VIEWER_ADD_THEMES          = 'VIEWER_ADD_THEMES'
export const VIEWER_REMOVE_THEMES       = 'VIEWER_REMOVE_THEMES'
export const VIEWER_SET_CONFIGJSON      = 'VIEWER_SET_CONFIGJSON'
export const VIEWER_UPDATE_MAPCONTROL   = 'VIEWER_UPDATE_MAPCONTROL'
export const VIEWER_SET_EXCUSIVE_MAPCONTROL = 'VIEWER_SET_EXCUSIVE_MAPCONTROL'

export const LAYOUT_WRAPPER_CLICK       = 'LAYOUT_WRAPPER_CLICK'
export const LAYOUT_TOGGLE_OVERLAYMENU  = 'LAYOUT_TOGGLE_OVERLAYMENU'
export const LAYOUT_TOGGLE_STATICMENU   = 'LAYOUT_TOGGLE_STATICMENU'
export const LAYOUT_TOGGLE_MOBILEMENU   = 'LAYOUT_TOGGLE_MOBILEMENU'

export const VIEWER_ADD_NOTIFICATION    = 'VIEWER_ADD_NOTIFICATION'
export const VIEWER_CLEAR_NOTIFICATIONS = 'VIEWER_CLEAR_NOTIFICATIONS'

export const VIEWER_ADD_DIALOG_WINDOW   = 'VIEWER_ADD_DIALOG_WINDOW '
export const VIEWER_REMOVE_DIALOG_WINDOW = 'VIEWER_REMOVE_DIALOG_WINDOW'
export const VIEWER_UPDATE_DIALOG_WINDOW = 'VIEWER_UPDATE_DIALOG_WINDOW'
export const VIEWER_CLEAR_DIALOG_WINDOWS = 'VIEWER_CLEAR_DIALOG_WINDOWS'

export const VIEWER_SET_TRANSLATION_NAMESPACES = 'VIEWER_SET_TRANSLATION_NAMESPACES' 


// Get config URL
const CONFIG_URL = process.env.REACT_APP_CONFIG_URL;
const API_URL = getAppApiUrl();
const MAP_PROXY = getAppMapProxyUrl();
const cookieAuthName = getCookieAuthName();
const cookiePath = process.env.REACT_APP_COOKIE_PATH || ''; 
const cookieExpiresDays = parseInt(process.env.REACT_APP_COOKIE_EXPIRES_DAYS || '150', 10);


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


export function viewer_save_record(record, history, redirect, cb) {
  return function (dispatch, getState) {
    dispatch(viewer_save_http_loading());

    // Save request
    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: record.id ? 'PUT' : 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(cookieAuthName);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    // Auth url. TODO: check for proxy
    let url = API_URL + '/app/viewer';
    if (record.id) url += '/' + record.id;
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        const save_options = record.id ? { 
          name: record.name,
          title: record.title,
          description: record.description,
          allow_user_session: record.allow_user_session || false,
          allow_anonymous: record.allow_anonymous,
          is_active: record.is_active
        } : null;
        if (cb) cb(res);
        dispatch(viewer_save_response(res, save_options));
      }).catch(error => {
        console.log('error', error);
        dispatch(viewer_save_http_error());
      });
  }
}

export function viewer_save_http_error() {
  const action = {
    type: VIEWER_SAVE_HTTP_ERROR,
    error: true
  }
  return action;
}

export function viewer_save_http_loading() {
  const action = {
    type: VIEWER_SAVE_HTTP_LOADING
  }
  return action;
}

export function viewer_save_response(res, save_options) {
  const action = {
    type: VIEWER_SAVE_RESPONSE,
    res,
    save_options
  }
  return action;
}

export function login_http_loading() {
  const action = {
    type: AUTH_HTTP_LOADING
  }
  return action;
}

export function login_post(post, history, redirect, urlRedirect) {
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
          let expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + parseInt(cookieExpiresDays));
          cookies.set(cookieAuthName, res, { path: urlRedirect || cookiePath, expires: expireDate });
          if (urlRedirect) {
            window.location.assign(urlRedirect);
          } else if (redirect && history) {
             history.push({ pathname: redirect }); 
          } else {
            window.location.reload();
          }
        } else {
          dispatch(login_http_error({ status: 401, message: i18nUtils.translateValue("wrongUsernamePassword", "Nome de Utilizador ou Palavra-passe inválido")}));
        }
      }).catch(error => {
        console.log('error', error);
        dispatch(login_http_error());
      });
  }
}

export function login(auth, history, redirect, urlRedirect) {
  return function (dispatch, getState) {
    dispatch(login_response(auth));
    if (auth.authenticated) {
      const cookies = new Cookies();
      let expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(cookieExpiresDays));
      cookies.set(cookieAuthName, auth, { path: urlRedirect || cookiePath, expires: expireDate });
      if (urlRedirect) {
        window.location.assign(urlRedirect);
      } else if (redirect && history) {
        history.push({ pathname: redirect }); 
      } else {
        window.location.reload();
      } 
    }
  }
}
/*
export function login(data) {
  const action = {
    type: AUTH_LOGIN,
    data
  }
  return action
}
*/

export function logout() {
  const cookies = new Cookies();
  cookies.remove(cookieAuthName, { path: cookiePath });
  window.location.reload();
}

export function login_http_error(res) {
  const action = {
    type: AUTH_HTTP_ERROR,
    res
  }
  return action;
}

export function login_clear_error() {
  const action = {
    type: AUTH_CLEAR_ERROR
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

export function login_reset_password(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(login_http_loading());
    
    let options = {
      method: 'POST',
      body: JSON.stringify({...post, redirect})
    }

    let url = API_URL + '/security/reset_password';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          dispatch(login_response({reset_password:true, ...res}));
        } else {
          let msg = res.message;
          if (res?.status === 401) {
            msg = i18nUtils.translateValue("wrongUser", "O Utilizador indicado não é válido")
          }
          dispatch(login_http_error({status: res.status, message: msg}));
        }
      }).catch(error => {
        dispatch(login_http_error());
      });
  }
}

export function password_http_loading() {
  const action = {
    type: PASSWORD_HTTP_LOADING
  }
  return action;
}

export function password_reset_validation(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(password_http_loading());
    
    // Login request
    let options = {
      method: 'POST',
      body: JSON.stringify(post)
    }

    let url = API_URL + '/security/reset_password_validation';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          dispatch(password_response(res));
        } else {
          dispatch(login_http_error({status: res.status, valid_token:false, message: res.message}));
        }
      }).catch(error => {
        dispatch(login_http_error({status: 401, valid_token:false, message: 'Serviço indisponível'}));
      });
  }
}


export function password_post(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(password_http_loading());
    
    let options = {
      method: 'POST',
      body: JSON.stringify(post)
    }

    let url = API_URL + '/security/set_password';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          dispatch(password_response(res));
        } else {
          dispatch(login_http_error({ status: res.status, message: res.message}));
        }
      }).catch(error => {
        dispatch(password_http_error());
      });
  }
}

export function password_response(res) {
  const action = {
    type: PASSWORD_RESPONSE,
    res
  }
  return action;
}

export function password_http_error(res) {
  const action = {
    type: PASSWORD_HTTP_ERROR,
    res
  }
  return action;
}

export function login_user_registration(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(login_http_loading());
    
    const { username, email } = post;

    let options = {
      method: 'POST',
      body: JSON.stringify({...post, redirect})
    }

    let url = API_URL + '/security/register_user';;
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          dispatch(login_response({register_user:true, username, email, redirect, ...res}));
        } else {
          if (res.status === 409) {
            dispatch(login_http_error({status: res.status, message: i18nUtils.translateValue("userRegistrationErrorAlreadyExists", res.message)}));
          } else {
            dispatch(login_http_error({status: res.status, message: res.message}));
          }
        }
      }).catch(error => {
        dispatch(login_http_error());
      });
  }
}

export function registration_http_loading() {
  const action = {
    type: REGISTRATION_HTTP_LOADING
  }
  return action;
}

export function registration_post(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(registration_http_loading());
    
    let options = {
      method: 'POST',
      body: JSON.stringify(post)
    }

    let url = API_URL + '/security/registration/confirmation';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        dispatch(registration_response(res));
        if (res.authenticated) {
          const cookies = new Cookies();
          let expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + parseInt(cookieExpiresDays));
          cookies.set(cookieAuthName, res, { path: cookiePath, expires: expireDate });
          if (redirect && history) history.push({ pathname: redirect }); 
          else window.location.reload();
        } else {
          //dispatch(registration_http_error({ status: 401, message: 'Nome de Utilizador ou Palavra-passe inválido'}));
        }
      }).catch(error => {
        dispatch(registration_http_error());
      });
  }
}

export function registration_confirmation(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(login_http_loading());
    
    let options = {
      method: 'POST',
      body: JSON.stringify(post)
    }

    let url = API_URL + '/security/registration/confirmation';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          dispatch(registration_response(res));
        } else {
          if (res.status === 401) {
            console.log(res.message);
            dispatch(login_http_error({status: res.status, message: i18nUtils.translateValue("userRegistrationInvalid", res.message)}));
          } else {
            dispatch(login_http_error({status: res.status, valid_token:false, message: res.message}));
          }
        }
      }).catch(error => {
        dispatch(login_http_error());
      });
  }
}


export function registration_send_confirmation(post, history, redirect) {
  return function (dispatch, getState) {
    dispatch(login_http_loading());
    
    let options = {
      method: 'POST',
      body: JSON.stringify({...post, redirect})
    }

    let url = API_URL + '/security/registration/send_confirmation';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (!res.error) {
          if (res?.email) {
            const msg = i18nUtils.translateValue("userRegistrationConfirmationSentToEmail","Enviada confirmação de registo de utilizador para o email {{email}}.", undefined, undefined, undefined, {email: res.email})
            dispatch(login_response({...res, message: msg}));
          } else {
            dispatch(login_response(res));
          }
        } else {
          if (res?.status === 401) {
            dispatch(login_http_error({status: res.status, message: i18nUtils.translateValue("userRegistrationConfirmationWrongEmail", res.message)}));
          } else {
            dispatch(login_http_error({status: res.status, message: res.message}));
          }
        }    
      }).catch(error => {
        dispatch(login_http_error());
      });
  }
}

export function registration_response(res) {
  const action = {
    type: REGISTRATION_RESPONSE,
    res
  }
  return action;
}

export function registration_http_error(res) {
  const action = {
    type: REGISTRATION_HTTP_ERROR,
    res
  }
  return action;
}

export function viewer_set_locale(data) {
  const action = {
    type: VIEWER_SET_LOCALE,
    data
  }
  return action;
}

export function viewer_set_drawings(data) {
  const action = {
    type: VIEWER_SET_DRAWINGS,
    data
  }
  return action;
}

export function viewer_set_featureinfo(data) {
  const action = {
    type: VIEWER_SET_FEATUREINFO,
    data
  }
  return action;
}

export function viewer_set_geolocation(data) {
  const action = {
    type: VIEWER_SET_GEOLOCATION,
    data
  }
  return action;
}

export function viewer_set_coordinates(data) {
  const action = {
    type: VIEWER_SET_COORDINATES,
    data
  }
  return action;
}

export function viewer_set_config(config) {
  const action = {
    type: VIEWER_SET_CONFIG,
    config,
    viewer: config
  }
  return action;
}

export function viewer_load_components(components) {
  const action = {
    type: VIEWER_LOAD_COMPONENTS,
    components
  }
  return action;
}

export function viewer_unload_components(core) {
  return function (dispatch, getState) {
    core.unloadComponents();
    const action = {
      type: VIEWER_UNLOAD_COMPONENTS
    }
    dispatch(action);
  }
}

export function viewer_error(history) {
  const action = {
    type: VIEWER_LOAD_ERROR,
    redirect: '/not-found'
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
  return action;
}

export function viewer_not_found(history) {
  const action =  {
    type: VIEWER_NOT_FOUND,
    redirect: '/not-found'
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
  return action;
}


export function viewer_not_authorized(history, redirect) {
  const action = {
    type: VIEWER_NOT_AUTHORIZED,
    redirect: redirect ? redirect : '/not-allowed'
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
  return action;
}

export function viewer_load_done(components) {
  const action = {
    type: VIEWER_LOAD_DONE
  }
  return action;
}

export function viewer_set_selectedmenu(selected_menu) {
  const action = {
    type: VIEWER_SET_SELECTEDMENU,
    selected_menu
  }
  return action;
}

export function viewer_set_exclusive_mapcontrol(exclusive_mapcontrol) {
  const action = {
    type: VIEWER_SET_EXCUSIVE_MAPCONTROL,
    exclusive_mapcontrol
  }
  return action;
}

export function viewer_load(core, id, history) {
  return function (dispatch, getState) {

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(cookieAuthName);
    
    // Fetch viewer
    let url = id ? API_URL + '/app/viewer/' + id + (history.location.search || '') : CONFIG_URL;
    if (!url) {
      url = API_URL + '/app/viewer' + (history.location.search || '')
    }

    const options = { headers: {} };
    
    // Add logged user token
    if (logged) options.headers['X-API-KEY'] = logged.token;
    
    // Make request
    fetch(url, options).then(res => {

      // Validate response
      if (res.status === 401) throw new Error('Unauthorized');
      else if (res.status !== 200) throw new Error('Not found');
      return res.json();
      
    }).then(config => {
      
      // Validate config
      if (!config) return dispatch(viewer_not_found(history));
      if (!config.config_json) return dispatch(viewer_not_found(history));

      //Clears authentication cookie if user is not valid
      if (!config?.user_info?.username) {
        const cookies = new Cookies();
        cookies.remove(cookieAuthName, { path: cookiePath });
      }

      // Unload components
      dispatch(viewer_unload_components(core));

      // Setup config
      config['checked'] = config.config_json.checked ? config.config_json.checked : [];
      config['removed'] = [];
      config['featureinfo'] = [];
      config['geolocation'] = null;
      config['coordinates'] = [];
      config['exclusive_mapcontrol'] = null;
      core.setConfig(config);

      if (config?.config_json?.show_menu === false || !config?.config_json?.selected_menu) {
        config['staticMenuInactive'] = true;
      }

      dispatch(viewer_set_config(config));

      // Load viewer custom translations
      loadTranslations(config.id, (data, error, ns) => {
        dispatch(viewer_set_translation_namespaces(ns));
      });

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
            dispatch(viewer_load_components(pitems));
            dispatch(viewer_load_done());
          }
        })
      })

    }).catch(error => {

      // Redirect to login or error pages
      if (error.message === 'Unauthorized') {
        if (!logged) {
          let redirect = '/login?redirect=' + (id || '/');
          if (window.location.pathname.toLowerCase().indexOf(core.BASE_URL + 'mapa') > -1) {
            redirect += '&path=/mapa/';
          } else if (window.location.pathname.toLowerCase().indexOf(core.BASE_URL + 'map') > -1) {
            redirect += '&path=/map/';
          } else if (window.location.pathname.toLowerCase().indexOf(core.BASE_URL) < 0) {
            redirect += '&url_redirect=/' + id;
          }
          history.push(redirect);
        } else dispatch(viewer_not_authorized(history));
      } else dispatch(viewer_not_found(history));
    })
  }
}

export function viewer_session_load(history) {
  const action =  {
    type: VIEWER_SESSION_LOAD,
    redirect: history.location.pathname + (history.location.search ? history.location.search + '&session=true' : '?session=true')
  }
  if (action.redirect && history) history.push({ pathname: action.redirect })
  return action;
}

export function viewer_session_saved(session) {
  const action =  {
    type: VIEWER_SESSION_SAVED,
    session: session
  }
  return action;
}

// TODO: calculate is theme on scale
export function isThemeOnScale(olmap, layer) {
  return isThemeOnScaleMapModel(olmap, layer);
}

export function map_set_extent(center, extent, srid) {
  let action = {
    type: MAP_SET_EXTENT,
    center,
    extent,
    srid
  }
  return action;
}

export function map_set_size(size) {
  let action = {
    type: MAP_SET_SIZE,
    size
  }
  return action;
}

export function map_set_class(className) {
  let action = {
    type: MAP_SET_CLASS,
    className
  }
  return action;
}

export function layers_set_checked(checked) {
  let action = {
    type: LAYERS_SET_CHECKED,
    checked
  }
  return action;
}

export function layers_set_opened(opened) {
  let action = {
    type: LAYERS_SET_OPENED,
    opened
  }
  return action;
}

export function layers_update_theme(theme) {
  let action = {
    type: LAYERS_UPDATE_THEME,
    theme
  }
  return action;
}

export function viewer_add_themes(parentId, themes = [], top, isSession=false) {
  let action = {
    type: VIEWER_ADD_THEMES,
    parentId,
    themes, 
    top,
    isSession
  }
  return action;
}

export function layers_remove_items(ids) {
  let action = {
    type: LAYERS_REMOVE_ITEMS,
    ids
  }
  return action;
}

export function viewer_remove_themes(ids) {
  let action = {
    type: VIEWER_REMOVE_THEMES,
    ids
  }
  return action;
}

export function viewer_set_configjson(config_json) {
  let action = {
    type: VIEWER_SET_CONFIGJSON,
    config_json
  }
  return action;
}

export function viewer_update_mapcontrol(control) {
  let action = {
    type: VIEWER_UPDATE_MAPCONTROL,
    control
  }
  return action;
}

export function viewer_set_displaycrs(crs) {
  let action = {
    type: VIEWER_SET_DISPLAYCRS,
    crs
  }
  return action;
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
      if (getState().root.viewer.layoutMode === 'overlay') {
        dispatch(layout_toggle_overlaymenu());
      } else if (getState().root.viewer.layoutMode === 'static') {
        dispatch(layout_toggle_staticmenu())
      }
    } else {
      dispatch(layout_toggle_mobilemenu())
    }
  }
}

export function layout_show_menu(isDesktop) {
  return (dispatch, getState) => {
    if (isDesktop) {
      if (getState().root.viewer.layoutMode === 'overlay') {
        if (getState().root.viewer.overlayMenuActive) {
          dispatch(layout_toggle_overlaymenu());
        }
      } else if (getState().root.viewer.layoutMode === 'static') {
        if (getState().root.viewer.staticMenuInactive) {
          dispatch(layout_toggle_staticmenu());
        }
      }
    } else {
      //dispatch(layout_toggle_mobilemenu())
      if (getState().root.viewer.layoutMode === 'overlay') {
        if (getState().root.viewer.overlayMenuActive) {
          dispatch(layout_toggle_overlaymenu());
        }
      } else if (getState().root.viewer.layoutMode === 'static') {
        if (!getState().root.viewer.mobileMenuActive) {
          dispatch(layout_toggle_mobilemenu());
        }
      } 
    }
  }
}

export function viewer_add_notification(notification) {
  let action = {
    type: VIEWER_ADD_NOTIFICATION,
    notification
  }
  return action;
}

export function viewer_clear_notifications() {
  let action = {
    type: VIEWER_CLEAR_NOTIFICATIONS
  }
  return action;
}

export function viewer_add_dialog_window({config, child, onClose}) {
  const dialogWindow = {
    key: config.key || new Date().getTime(),
    config,
    child,
    visible: true,
    onClose
  }

  let action = {
    type: VIEWER_ADD_DIALOG_WINDOW,
    dialogWindow: dialogWindow
  }
  return action;
}

export function viewer_remove_dialog_window(key) {
  let action = {
    type: VIEWER_REMOVE_DIALOG_WINDOW,
    key
  }
  return action;
}

export function viewer_update_dialog_window({config, child, visible}) {
  let action = {
    type: VIEWER_UPDATE_DIALOG_WINDOW,
    config,
    child,
    visible
  }
  return action;
}

export function viewer_clear_dialog_windows() {
  let action = {
    type: VIEWER_CLEAR_DIALOG_WINDOWS
  }
  return action;
}

export function viewer_set_translation_namespaces(ns) {
  let action = {
    type: VIEWER_SET_TRANSLATION_NAMESPACES,
    ns
  }
  return action;
}


export function getThemeLegendUrl(config) {
  let url = config.legend_url;
  if (!url && config.type === 'WMS') {
    url = createLegendUrl(config.url, config.wms_layers || config.layers, config.crs)
  } else {
    if (window.location.protocol === 'https:' && !isUrlAppOrigin(url) && navigator.userAgent.indexOf("Firefox") == -1) {
      const turl = new URL(url);
      if (turl.protocol === 'http:') {
        url = MAP_PROXY + encodeURIComponent(url);
      }
    }
  }
  return url;
}

// TODO: decide where to put this
const createLegendUrl = (url, layer, srs = 4326) => {
  let finalurl = url;
  finalurl += finalurl.indexOf('?') === -1 ? '?' : '';

  //console.log('SRS=' + (srs.indexOf(':') === -1 ? 'EPSG:' + srs : srs));

  finalurl = finalurl + '&' + ([
        'SERVICE=WMS',
        'VERSION=1.1.1',
        'REQUEST=GetLegendGraphic',
        'FORMAT=image%2Fpng',
        'SRS=' + (String(srs).indexOf(':') === -1 ? 'EPSG:' + srs : srs),
        'CRS=' + (String(srs).indexOf(':') === -1 ? 'EPSG:' + srs : srs),
        'LAYER=' + layer
    ].join('&'));

  if (window.location.protocol == 'https:' && !isUrlAppOrigin(finalurl) && navigator.userAgent.indexOf("Firefox") == -1) {
    const turl = new URL(finalurl);
    if (turl.protocol === 'http:') {
      finalurl = MAP_PROXY + encodeURIComponent(finalurl);
    }
  }

  return finalurl;
};

export const transform_extent = (source, target, extent) => {
  return transformExtent(source, target, extent);
}