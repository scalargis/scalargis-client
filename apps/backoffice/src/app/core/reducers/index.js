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
  BACKOFFICE_SET_CONFIG,
  AUTH_HTTP_ERROR,
  AUTH_HTTP_LOADING,
  AUTH_RESPONSE,
  AUTH_LOGIN,
  AUTH_UPDATE,
} from '../actions'
import { getCookieAuthName } from '../utils'

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
const cookieAuthName = getCookieAuthName();


const reducer = (state = { loading: true, auth: { data: cookies.get(cookieAuthName)}, config: null, backoffice: initialBackoffice, components: {} }, action) => {
  
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

    // Update user auth
    case AUTH_UPDATE:
      return {
        ...state,
        auth: {
          ...state?.auth,
          data: {
            ...state?.auth?.data,
            ...action.data
          }
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