import React from 'react'
import { extend, omit } from 'underscore'
import thunk from 'redux-thunk'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import * as local_components from './core/components'
import * as core_components from '@scalargis/components'
import * as actions from './core/actions'
import * as utils from './core/utils'
import * as pubsub from './core/pubsub'

import { initTranslations } from './core/i18n';

// Init translations
initTranslations();

export function createReducerManager(initialReducers) {
  // Create an object which maps keys to reducers
  const reducers = { ...initialReducers }

  const reducers_list = {}

  // Create the initial combinedReducer
  let combinedReducer = combineReducers(reducers)

  // An array which is used to delete state keys when reducers are removed
  let keysToRemove = []

  return {
    getReducerMap: () => reducers,

    // The root reducer function exposed by this object
    // This will be passed to the store
    reduce: (state, action) => {
      // If any reducers have been removed, clean up their state first
      if (keysToRemove.length > 0) {
        state = { ...state }
        for (let key of keysToRemove) {
          delete state[key]
        }
        keysToRemove = []
      }

      // Delegate to the combined reducer
      return combinedReducer(state, action)
    },

    // Adds a new reducer with the specified key
    add: (key, reducer) => {
      if (reducers_list[key]) {
        reducers_list[key] = 
        { 
          ...reducers_list[key], 
          ...reducer
        }
      } else {
        reducers_list[key] = { ...reducer }
      }

      const new_reducer = (state = {}, action) => {
        if (reducers_list[key] && reducers_list[key][action.type]) {
          const reducer_func = reducers_list[key][action.type];
          const new_state = reducer_func(state, action);
          return new_state;
        }

        return state;
      }
      //Set internal reducer function name equal to reducer key
      Object.defineProperty(new_reducer, 'name', {value: key})

      // Add the reducer to the reducer mapping
      reducers[key] = new_reducer;

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers)
    },

    // Removes a reducer with the specified key
    remove: key => {
      if (!key || !reducers[key]) {
        return
      }

      // Remove it from the reducer mapping
      delete reducers[key]

      // Add the key to the list of keys to clean up
      keysToRemove.push(key)

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
    }
  }
}

function Core(config, reducers) {

  const reducerManager = createReducerManager(reducers);

  const store = createStore(reducerManager.reduce, applyMiddleware(thunk));
  // Put the reducer manager on the store so it is easily accessible
  store.reducerManager = reducerManager;
  //console.log(store.getState());

  /**
  * Apply config options
  */
  for (const [key, value] of Object.entries(config)) {
    this[key] = value
  }

  /**
   * Hold programatic config
   */
  this.config = {};

  /**
   * Hold redux actions
   */
  this.actions = actions;

  /**
   * Hold PubSubs methods
   */
  this.pubsub = pubsub;

  /**
   * Hold redux store
   */
  this.store = store;
  //this.store = createStore(rootReducer, applyMiddleware(thunk));

  /**
   * Hold app components
   */
  this.__components = {};

  /**
   * Hold menu components
   */
  this.__mainmenu = {};

  /**
   * Secure app props
   */
  this.__secureProps = ['config', 'actions', 'store', 'Renderer', '__components', '__mainmenu'];
}

// Set core config
Core.prototype.setConfig = function(config) {
  this.config = config;
}

// Add components
Core.prototype.addComponent = function(core, component, done) {

  const components = { ...local_components, ...core_components};
  
  if (components[component.type]) {

    //Add local and core components
    const c = components[component.type];

    // Add component actions
    if (c.actions && typeof c.actions === 'object') {
      core.actions = extend(core.actions, omit(c.actions, this.__secureProps ));
    }

    // Add component reducers
    if (c.reducers && typeof c.reducers === 'object') {
      Object.entries(c.reducers).forEach(function([key, reducer]) {
        core.store.reducerManager.add(key, reducer);
     });
    }

    // Load component translations
    if (c.translations && typeof c.translations === 'object') {
      c.translations.load && c.translations.load();
    }

    // Registry Pattern: register react component in components registry
    if (!!c.default && !this.__components[component.type]) {   
      const ReactComponent = c.default;
      this.__components[component.type] = ReactComponent;
    }

    // Main menu registry
    if (!!c.MainMenu && !this.__mainmenu[component.type]) {
      const MainMenu = c.MainMenu;
      this.__mainmenu[component.type] = MainMenu;
    }

    done();
    
  } else {
    // Add plugin components
    import('./components/' + component.type + '/src/Main.js').then(c => {

      // Add component actions
      if (c.actions && typeof c.actions === 'object') {
        core.actions = extend(core.actions, omit(c.actions, this.__secureProps ));
      }

      // Add component reducers
      if (c.reducers && typeof c.reducers === 'object') {
          Object.entries(c.reducers).forEach(function([key, reducer]) {
            core.store.reducerManager.add(key, reducer);
        });
      }

      // Load component translations
      if (c.translations && typeof c.translations === 'object') {
        c.translations.load && c.translations.load();
      }

      // Registry Pattern: register react component in components registry 
      if (!!c.default && !this.__components[component.type]) {
        const ReactComponent = c.default;
        this.__components[component.type] = ReactComponent;
      }

      // Main menu registry
      if (!!c.MainMenu && !this.__mainmenu[component.type]) {
        const MainMenu = c.MainMenu;
        this.__mainmenu[component.type] = MainMenu;
      }
      
      done();
    }).catch(err => {
      console.log('Error loading module:', err);
      done();
    })
  }
}

Core.prototype.unloadComponents = function() {
  this.__components = {}
}

Core.prototype.renderMainMenu = function({ selected_menu, section, props }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__mainmenu);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;

  // Filter by mainmenu components (main section)
  let mainmenuComponents = components.filter(c => c.target === 'mainmenu' && !c.section);

  // Filter by section
  if (section) {
    mainmenuComponents = components.filter(c => c.target === 'mainmenu' && c.section === section);
  }
  
  // Render components
  return (
    <nav aria-label="Menu principal">
      <ul>
        { mainmenuComponents.map(c => {
          let PluginComponent = this.__mainmenu[c.type];

          // Validate dynamic import is loaded
          if (!PluginComponent) return null;

          const className = selected_menu === c.id ?
          "p-button-rounded p-button-raised p-button-sm" :
          "p-button-rounded p-button-raised p-button-sm p-button-outlined";

          return (
            <li key={c.id}>
              <PluginComponent
                className={className}
                record={c}
                config={{ className, ...props, ...c.config_json }}
                core={this}
                actions={this.actions}
                utils={utils}
              />
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

Core.prototype.renderComponentById = function({ id, as = '', props, }) {

  // Validate id
  if (!id) return null;
  
  // Validate not empty components registry
  const keys = Object.keys(this.__components);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Filter by id
  let c = components.find(c => c.id === id);

  // Render components
  let PluginComponent = this.__components[c.type];

  // Validate dynamic import is loaded
  if (!PluginComponent) return null;
  return (
    <PluginComponent
      record={c}
      config={{ ...props, ...c.config_json }}
      core={this}
      actions={this.actions}
      as={as}
      utils={utils}
    />
  )
}

Core.prototype.renderComponents = function({ region, as = '', mobileMenu = [], props, parent, separator = '', style = null, className = '' }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__components);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Filter by parent
  if (parent) components = components.filter(c => parent.children.includes(c.id));

  // Filter by region
  const regionComponents = components.filter(c => c.target === region && !mobileMenu.includes(c.id));

  // Render components
  return regionComponents.map(c => {
    let PluginComponent = this.__components[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;
    return (
      <div key={c.id} className={className} style={style ? style(c) : null }>
        <PluginComponent
          record={c}
          config={{ ...props, ...c.config_json }}
          core={this}
          actions={this.actions}
          region={region}
          as={c.as || as}
          utils={utils}
        />
        { separator }
      </div>
    )
  })
}

Core.prototype.renderComponentsMenu = function({ region, as = '', mobileMenu = [], props, parent, separator = '', style = null, className = '' }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__components);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Filter by parent
  if (parent) components = components.filter(c => parent.children.includes(c.id));

  // Filter by region
  const regionComponents = components.filter(c => c.target === region);

  let menuComponents = [];
  if (mobileMenu.length) {
    mobileMenu.forEach(k => {
      const cmp = regionComponents.find(c => c.id === k);
      if (cmp) menuComponents.push(cmp);
    });
  } else {
    menuComponents = regionComponents;
  }

  // Render components
  //return regionComponents.map(c => {
  return menuComponents.map(c => {
    let PluginComponent = this.__components[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;
    return (
      <div key={c.id} className={className} style={style ? style(c) : null }>
        <PluginComponent
          type="menu"
          record={c}
          config={{ ...props, ...c.config_json }}
          core={this}
          actions={this.actions}
          region={region}
          as={c.as || as}
          utils={utils}
        />
        { separator }
      </div>
    )
  })
}

Core.prototype.renderComponentsLinks = function({ region, as = '', props, parent, separator = '', style = null, className = '' }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__components);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Filter by parent
  if (parent) components = components.filter(c => parent.children.includes(c.id));

  // Filter by region
  const regionComponents = components.filter(c => c.links === region);

  // Render components
  return regionComponents.map(c => {
    let PluginComponent = this.__components[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;
    return (
      <div key={c.id} className={className} style={style ? style(c) : null }>
        <PluginComponent
          type="link"
          region={region}
          record={c}
          config={{ ...props, ...c.config_json }}
          core={this}
          actions={this.actions}
          as={as}
          utils={utils}
        />
        { separator }
      </div>
    )
  })
}

export default Core;
