import Cookies from 'universal-cookie'
import {
  LAYOUT_TOGGLE_MOBILEMENU,
  LAYOUT_TOGGLE_OVERLAYMENU,
  LAYOUT_TOGGLE_STATICMENU,
  LAYOUT_WRAPPER_CLICK,
  LAYOUT_SET_MODE,
  LAYOUT_SET_COLORMODE,
  BACKOFFICE_LOAD,
  BACKOFFICE_LOAD_COMPONENTS,
  BACKOFFICE_UNLOAD_COMPONENTS,
  BACKOFFICE_LOAD_DONE,
   /*
  VIEWER_ADD_THEMES,
  VIEWER_REMOVE_THEMES,
  LAYERS_SET_CHECKED,
  LAYERS_SET_OPENED,
  */
  BACKOFFICE_SET_CONFIG,
  BACKOFFICE_SET_VIEWERSFILTER,
  /*
  VIEWER_SET_CONFIGJSON,
  VIEWER_SET_SELECTEDMENU,
  VIEWER_SET_EXCUSIVE_MAPCONTROL,
  LAYERS_UPDATE_THEME,
  LAYERS_REMOVE_ITEMS,
  MAP_SET_EXTENT,
  VIEWER_SET_DISPLAYCRS,
  */
  AUTH_HTTP_ERROR,
  AUTH_HTTP_LOADING,
  AUTH_RESPONSE,
  AUTH_LOGIN,
  /*
  VIEWER_SET_FEATUREINFO,
  VIEWER_SET_GEOLOCATION,
  VIEWER_UPDATE_MAPCONTROL,
  VIEWER_SAVE_HTTP_LOADING,
  VIEWER_SAVE_HTTP_ERROR,
  VIEWER_SAVE_RESPONSE,

  VIEWER_SESSION_SAVED,

  VIEWER_SET_DRAWINGS,
  VIEWER_SET_COORDINATES
  */
} from '../actions'
/*
import { traverseLayersTree } from '../utils';
*/
const initialBackoffice = {
  layoutMode: 'static',
  layoutColorMode: 'light',
  staticMenuInactive: false,
  overlayMenuActive: false,
  mobileMenuActive: false,
  config_json: {
  }
}

const cookies = new Cookies();
const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'websig_dgt';

//export default (state = { loading: true, auth: { data: cookies.get(cookieAuthName)}, config: null, viewer: initialViewer, components: {} }, action) => {
//export default (state = { loading: true, auth: { data: cookies.get(cookieAuthName)}, config: null, components: {} }, action) => {
const reducer = (state = { loading: true, auth: { data: cookies.get(cookieAuthName)}, config: null, backoffice: initialBackoffice, components: {} }, action) => {

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

    // Login response
    case AUTH_RESPONSE:
      return {
        ...state,
        auth: {
          loading: false,
          response: action.res
        }
      }

    // Login user
    case AUTH_LOGIN:
      return {
        ...state,
        auth: {
          loading: false,
          data: action.data
        }
      }
    
    // Start loading backoffice config
    case BACKOFFICE_LOAD:
      return {
        ...state,
        loading: true
      }

    // Set viewer config
    case BACKOFFICE_SET_CONFIG:
      return {
        ...state,
        config: action.config,
        backoffice: {
          ...initialBackoffice,
          ...action.backoffice
        }
      }
    
    /*

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
    */

    case BACKOFFICE_LOAD_COMPONENTS:
      return {
        ...state,
        components: action.components
      }

    case BACKOFFICE_UNLOAD_COMPONENTS:
      return {
        ...state,
        components: {}
      }

    case BACKOFFICE_LOAD_DONE:
      return {
        ...state,
        loading: false
      }
    
    case BACKOFFICE_SET_VIEWERSFILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          viewers: action.filter
        } 
      }

    /*
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

      return {
        ...state,
        viewer: {
          ...state.viewer,
          config_json: {
            ...state.viewer.config_json,
            layers: newlayers
          }
        }
      }

    // Remove themes from ids
    // DEPRECATED
    case VIEWER_REMOVE_THEMES:
      let { removed } = state.viewer;
      removed = removed.concat(action.ids);
      return {
        ...state,
        viewer: {
          ...state.viewer,
          removed
        }
      }

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
    
    */

    // On click layout
    case LAYOUT_WRAPPER_CLICK:
      return {
      ...state,
      backoffice: {
        ...state.backoffice,
        overlayMenuActive: false,
        mobileMenuActive: false
      }
    }

    // Toggle overlay menu
    case LAYOUT_TOGGLE_OVERLAYMENU:
      return {
      ...state,
      backoffice: {
        ...state.backoffice,
        overlayMenuActive: !state.backoffice.overlayMenuActive
      }
    }

    // Toggle static menu
    case LAYOUT_TOGGLE_STATICMENU:
      return {
      ...state,
      backoffice: {
        ...state.backoffice,
        staticMenuInactive: !state.backoffice.staticMenuInactive
      }
    }

    // Toggle mobile menu
    case LAYOUT_TOGGLE_MOBILEMENU:
      return {
      ...state,
      backoffice: {
        ...state.backoffice,
        mobileMenuActive: !state.backoffice.mobileMenuActive
      }
    }

    // Set layout mode
    case LAYOUT_SET_MODE:
      return {
      ...state,
      backoffice: {
        ...state.backoffice,
        layoutMode: action.layoutMode
      }
    }

    // Set layout mode
    case LAYOUT_SET_COLORMODE:
      return {
      ...state,
      backoffice: {
        ...state.backoffice,
        layoutColorMode: action.layoutColorMode
      }
    }    

    // Not state change
    default:
      return state;
  }
}

export default reducer;