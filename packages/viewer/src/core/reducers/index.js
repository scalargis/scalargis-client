import Cookies from 'universal-cookie';
import {
  LAYOUT_TOGGLE_MOBILEMENU,
  LAYOUT_TOGGLE_OVERLAYMENU,
  LAYOUT_TOGGLE_STATICMENU,
  LAYOUT_WRAPPER_CLICK,
  VIEWER_LOAD,
  VIEWER_LOAD_COMPONENTS,
  VIEWER_UNLOAD_COMPONENTS,
  VIEWER_LOAD_DONE,
  VIEWER_ADD_THEMES,
  VIEWER_REMOVE_THEMES,
  LAYERS_SET_CHECKED,
  LAYERS_SET_OPENED,
  VIEWER_SET_CONFIG,
  VIEWER_SET_CONFIGJSON,
  VIEWER_SET_SELECTEDMENU,
  VIEWER_SET_EXCUSIVE_MAPCONTROL,
  LAYERS_UPDATE_THEME,
  LAYERS_REMOVE_ITEMS,
  MAP_SET_EXTENT,
  MAP_SET_SIZE,
  MAP_SET_CLASS,
  VIEWER_SET_DISPLAYCRS,
  AUTH_HTTP_ERROR,
  AUTH_CLEAR_ERROR,
  AUTH_HTTP_LOADING,
  AUTH_RESPONSE,
  //AUTH_LOGIN,
  PASSWORD_HTTP_ERROR,
  PASSWORD_HTTP_LOADING,
  PASSWORD_RESPONSE,
  REGISTRATION_HTTP_ERROR,
  REGISTRATION_HTTP_LOADING,
  REGISTRATION_RESPONSE,
  VIEWER_SET_LOCALE,
  VIEWER_SET_FEATUREINFO,
  VIEWER_SET_GEOLOCATION,
  VIEWER_UPDATE_MAPCONTROL,
  VIEWER_SAVE_HTTP_LOADING,
  VIEWER_SAVE_HTTP_ERROR,
  VIEWER_SAVE_RESPONSE,

  VIEWER_SESSION_SAVED,

  VIEWER_SET_DRAWINGS,
  VIEWER_SET_COORDINATES,

  VIEWER_ADD_NOTIFICATION,
  VIEWER_CLEAR_NOTIFICATIONS,

  VIEWER_SET_TRANSLATION_NAMESPACES
} from '../actions';
import { traverseLayersTree, getCookieAuthName } from '../utils';


const initialViewer = {
  layoutMode: 'static',
  layoutColorMode: 'light',
  staticMenuInactive: false,
  overlayMenuActive: false,
  mobileMenuActive: false,
  config_json: {
    layers: [],
    removed: [],
    map_controls: []
  }
}

const cookies = new Cookies();
const cookieAuthName = getCookieAuthName();

//export default (state = { loading: true, auth: { data: cookies.get(cookieAuthName)}, config: null, viewer: initialViewer, components: {} }, action) => {
const root = (state = { loading: true, auth: { data: cookies.get(cookieAuthName)}, registration: {}, password: {}, config: null, viewer: initialViewer, components: {}, notifications: [] }, action) => {

  //console.log('action', action);
  
  switch (action.type) {

    // Login loading
    case AUTH_HTTP_LOADING:
      return {
        ...state,
        auth: {
          loading: true,
          http_error: false,
          error: null
        }
      }

    // Login http error
    case AUTH_HTTP_ERROR:
      return {
        ...state,
        auth: {
          loading: false,
          http_error: true,
          response: action.res
        }
      }

    // Login http error
    case AUTH_CLEAR_ERROR:
      return {
        ...state,
        auth: {
          loading: false,
          http_error: false,
          response: null
        }
      }      

    // Login response
    case AUTH_RESPONSE:
      return {
        ...state,
        auth: {
          loading: false,
          response: action.res
        }
      }
    
    /*
    // Login user
    case AUTH_LOGIN:
      return {
        ...state,
        auth: {
          loading: false,
          data: action.data
        }
      }
    */

    // Password loading
    case PASSWORD_HTTP_LOADING:
      return {
        ...state,
        password: {
          loading: true,
          http_error: false,
          error: null
        }
      }      

    // Password http error
    case PASSWORD_HTTP_ERROR:
      return {
        ...state,
        password: {
          loading: false,
          http_error: true,
          response: action.res
        }
      }

    // Password response
    case PASSWORD_RESPONSE:
      return {
        ...state,
        password: {
          loading: false,
          response: action.res
        }
      }

    // Registration loading
    case REGISTRATION_HTTP_LOADING:
      return {
        ...state,
        registration: {
          loading: true,
          http_error: false,
          error: null
        }
      }      

    // Registration http error
    case REGISTRATION_HTTP_ERROR:
      return {
        ...state,
        registration: {
          loading: false,
          http_error: true,
          response: action.res
        }
      }

    // Rgistration response
    case REGISTRATION_RESPONSE:
      return {
        ...state,
        registration: {
          loading: false,
          response: action.res
        }
      }      
    
    // Start loading viewer config
    case VIEWER_LOAD:
      return {
        ...state,
        loading: true
      }

    // Set viewer config
    case VIEWER_SET_CONFIG:
      return {
        ...state,
        config: action.config,
        viewer: {
          ...initialViewer,
          ...action.viewer
        }
      }

    // Save loading
    case VIEWER_SAVE_HTTP_LOADING:
      return {
        ...state,
        viewer: {          
          ...state.viewer,
          save_loading: true,
          save_response: null,
          save_error: null
        }
      }      

    // Set save viewer HTTP error
    case VIEWER_SAVE_HTTP_ERROR:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          save_loading: false,
          save_error: action.error
        }
      }

    // Set save viewer last response
    case VIEWER_SAVE_RESPONSE:
      let save_options = {
        name: action.save_options ? action.save_options.name : state.viewer.name,
        title: action.save_options ? action.save_options.title : state.viewer.title,
        description: action.save_options ? action.save_options.description : state.viewer.description,
        allow_anonymous: action.save_options ? action.save_options.allow_anonymous : state.viewer.allow_anonymous,
        allow_user_session : action.save_options ? action.save_options.allow_user_session : state.viewer.allow_user_session,
        is_active: action.save_options ? action.save_options.is_active : state.viewer.is_active
      }
      return {
        ...state,
        viewer: {
          ...state.viewer,
          ...save_options,
          save_loading: false,
          save_response: action.res          
        }
      }     

    case VIEWER_LOAD_COMPONENTS:
      return {
        ...state,
        components: action.components
      }

    case VIEWER_UNLOAD_COMPONENTS:
      return {
        ...state,
        components: {}
      }

    case VIEWER_LOAD_DONE:
      return {
        ...state,
        loading: false
      }

    // Map set extent
    case VIEWER_SET_SELECTEDMENU:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            selected_menu: action.selected_menu
          }
        }
      }

    case VIEWER_SET_EXCUSIVE_MAPCONTROL:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          exclusive_mapcontrol: action.exclusive_mapcontrol
        }
      }

    case VIEWER_SET_LOCALE:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          locale: action.data
        }
      }

    case VIEWER_SET_DRAWINGS:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            drawings: [...action.data]
          }
        }
      }

    case VIEWER_SET_FEATUREINFO:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          featureinfo: [...action.data]
        }
      }

    case VIEWER_SET_GEOLOCATION:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          geolocation: action.data
        }
      }

    case VIEWER_SET_COORDINATES:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          coordinates: [...action.data]
        }
      }

    // Map set extent
    case MAP_SET_EXTENT:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            center: action.center,
            extent: action.extent
          }
        }
      }

    // Map set size
    case MAP_SET_SIZE:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          size: action.size
        }
      }

    // Map set class
    case MAP_SET_CLASS:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          className: action.className
        }
      }       
    
      // Set checked themes
    case LAYERS_SET_CHECKED:
      const checked = [ ...action.checked ]
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            checked
          }
        }
      }

      // Set opened themes
      case LAYERS_SET_OPENED:
        const opened = [ ...action.opened ]
        return {
          ...state,
          viewer: {
            ...state.viewer,
            config_json: {
              ...state.viewer.config_json,
              opened
            }
          }
        }      

    // Update theme
    case LAYERS_UPDATE_THEME:
      let { layers } = state.viewer.config_json;
      let index = layers.findIndex(i => i.id === action.theme.id);
      layers.splice(index, 1, action.theme);
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            layers
          }
        }
      }

    // Remove layers
    case LAYERS_REMOVE_ITEMS:
      let updated = Object.assign([], state.viewer.config_json.layers);
      
      // Update session layers list
      let removedLayers = [];
      traverseLayersTree(updated.filter(l => action.ids.includes(l.id)), null, (l, i) => {
        removedLayers.push(l.id);
        if (l?.children?.length) {
          removedLayers = [...removedLayers, ...l.children];
        }
      });
      const sessionLayers = Object.assign([], state.viewer.session_layers).filter(l => !removedLayers.includes(l));

      // Remove as child layers
      traverseLayersTree(updated, null, (l, i) => {
        if (l.children) l.children = l.children.filter(cid => action.ids.includes(cid) === false);
      });

      // Remove layers
      traverseLayersTree(updated, null, (l, i) => {
        if (action.ids.includes(l.id)) updated.splice(updated.indexOf(l), 1);
      });

      return {
        ...state,
        viewer: {
          ...state.viewer,
          session_layers: sessionLayers,
          config_json: {
            ...state.viewer.config_json,
            layers: updated
          }
        }
      }

    case VIEWER_SET_DISPLAYCRS:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            display_crs: action.crs
          }
        }
      }

    // Add themes
    case VIEWER_ADD_THEMES:
      const tlayers = state.viewer.config_json.layers;

      // Add themes
      let newlayers = Object.assign([], tlayers);

      newlayers = newlayers.concat(action.themes.map((t)=>({
        ...t,
        opacity: (t.opacity != undefined) ? t.opacity : 1
      })));

      // Find parent index
      let parentId = action.parentId || 'main';
      let parentIndex = newlayers.findIndex(i => i.id === parentId);
      const parent = Object.assign({}, newlayers[parentIndex]);
      if (action.top) {
        parent.children = action.themes.map(t => t.id).concat(parent.children);
      } else {
        parent.children = parent.children.concat(action.themes.map(t => t.id));
      }
      newlayers.splice(parentIndex, 1, parent);

      // Update session layers list
      let newSessionLayers = [];
      if (Array.isArray(state?.viewer?.session_layers)) {
        newSessionLayers = [...state.viewer.session_layers];
      }
      if (action?.isSession) {
        newSessionLayers = [...newSessionLayers, ...action.themes.map(l => l.id)];
      }

      return {
        ...state,
        viewer: {
          ...state.viewer,
          session_layers: newSessionLayers,
          config_json: {
            ...state.viewer.config_json,
            layers: newlayers
          }
        }
      }

    // Remove themes from ids
    case VIEWER_REMOVE_THEMES:
      return (function () {
        const allIds = Object.assign([], action.ids);//[...action.ids];
        action.ids.forEach(id => {
          const layer = state.viewer.config_json.layers.find( l => l.id === id);
          if (layer.type === "GROUP") {
              traverseLayersTree(state.viewer.config_json.layers, id, (l, i) => {
                  if (!allIds.includes(l.id)) allIds.push(l.id);
              });
          }
        });
        let updated = Object.assign([], state.viewer.config_json.layers);

        // Remove as child layers
        traverseLayersTree(updated, null, (l, i) => {
          if (l.children) l.children = l.children.filter(cid => allIds.includes(cid) === false);
        });
        // Remove layers
        updated = updated.filter(l => !allIds.includes(l.id));

        //Update opened list
        let opened = Object.assign([], state.viewer.config_json.opened);
        opened = opened.filter(id => !allIds.includes(id));
        //Update checked list
        let checked =  Object.assign([], state.viewer.config_json.checked);
        checked = checked.filter(id => !allIds.includes(id));

        return {
          ...state,
          viewer: {
            ...state.viewer,
            config_json: {
              ...state.viewer.config_json,
              layers: updated,
              opened: opened,
              checked: checked
            }
          }
        }
      }());

    // Update map control
    case VIEWER_UPDATE_MAPCONTROL:
      let { map_controls } = state.viewer.config_json;
      let mindex = map_controls.findIndex(i => i.id === action.control.id);
      map_controls.splice(mindex, 1, action.control);
      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            map_controls
          }
        }
      }

    // Set viewer configjson
    case VIEWER_SET_CONFIGJSON:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          configjson: action.configjson
        }
      }

    // Set viewer configjson
    case VIEWER_SESSION_SAVED:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          is_session: true,
          session: action.session,
          save_loading: false,
          save_response: null,
          save_error: null          
        }
      }

    // On click layout
    case LAYOUT_WRAPPER_CLICK:
      return {
      ...state,
      viewer: {
        ...state.viewer,
        overlayMenuActive: false//,
        //mobileMenuActive: false
      }
    }

    // Toggle overlay menu
    case LAYOUT_TOGGLE_OVERLAYMENU:
      return {
      ...state,
      viewer: {
        ...state.viewer,
        overlayMenuActive: !state.viewer.overlayMenuActive
      }
    }

    // Toggle static menu
    case LAYOUT_TOGGLE_STATICMENU:
      return {
      ...state,
      viewer: {
        ...state.viewer,
        staticMenuInactive: !state.viewer.staticMenuInactive
      }
    }

    // Toggle mobile menu
    case LAYOUT_TOGGLE_MOBILEMENU:
      return {
        ...state,
        viewer: {
          ...state.viewer,
          mobileMenuActive: !state.viewer.mobileMenuActive
        }
      }

    // Add notification
    case VIEWER_ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications.splice(-5), action.notification]
      }

    // Clear notifications
    case VIEWER_CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      }

    // Set translation namespaces
    case VIEWER_SET_TRANSLATION_NAMESPACES:
      return {
        ...state,
        translation_namespaces: action.ns
      }

    // Not state change
    default:
      return state;
  }
}

export default {
  root
}