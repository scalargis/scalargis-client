import React from 'react'
import { extend, omit } from 'underscore'
import thunk from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import * as actions from './core/actions'
import * as utils from './core/utils'


import { initTranslations } from './core/i18n';

// Init translations
initTranslations();


function Core(config, rootReducer) {

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
   * Hold redux store
   */
  this.store = createStore(rootReducer, applyMiddleware(thunk));

  /**
   * Hold app components
   */
  this.__components = {};

  /**
   * Hold menu components
   */
  this.__mainmenu = {};

  /**
   * Hold manager components
   */
   this.__managers = {};

  /**
   * Secure app props
   */
  this.__secureProps = ['config', 'actions', 'store', 'Renderer', '__components', '__mainmenu', '__managers'];
}

// Set core config
Core.prototype.setConfig = function(config) {
  this.config = config;
}

// Add components
Core.prototype.addComponent = function(core, component, done) {
  import('./components/' + component.type + '/src/Main.js').then(c => {

    // Basic Decorator Pattern: decorates core with additional functionality
    if (c.decorators && typeof c.decorators === 'object') {
      core.actions = extend(core.actions, omit(c.decorators, this.__secureProps ));
    }

    // TODO: Add plugin redux actions/reducers
    // Hint: replaceReducer https://redux.js.org/api/store#replacereducernextreducer
    // Get current reducer
    // Add plugin reducer
    // Replace reducer

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

    // Manager registry
    if (!!c.Manager && !this.__managers[component.type]) {
      const Manager = c.Manager;
      this.__managers[component.type] = Manager;
    }    
    
    done();
  }).catch(err => {
    console.log('Error loading module:', err);
    done();
  })
}

Core.prototype.unloadComponents = function() {
  this.__components = {}
  this.__managers = {}
}

Core.prototype.renderMainMenu = function({ selected_menu, props }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__mainmenu);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Render components
  return components.map(c => {
    let PluginComponent = this.__mainmenu[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;

    const className = selected_menu === c.id ?
    "p-button-rounded p-button-raised p-button-sm" :
    "p-button-rounded p-button-raised p-button-sm p-button-outlined";

    return (
      <React.Fragment key={c.id}>
        <PluginComponent
          className={className}
          record={c}
          config={{ className, ...props, ...c.config_json }}
          core={this}
          actions={this.actions}
          utils={utils}
        />
      </React.Fragment>
    )
  })
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

Core.prototype.renderComponents = function({ region, as = '', props, parent, separator = '', style = null, className = '' }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__components);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Filter by parent
  if (parent) components = components.filter(c => parent.children.includes(c.id));

  // Filter by region
  const regionComponents = components.filter(c => c.target === region);

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
          as={as}
          utils={utils}
        />
        { separator }
      </div>
    )
  })
}

Core.prototype.renderComponentManager = function({ id, submodule, action, as = '', props }) {

  // Validate id
  if (!id) return null;
  
  // Validate not empty components registry
  const keys = Object.keys(this.__managers);
  if (keys.length === 0) return null;

  // From all components
  let { components } = this.config.config_json;
  
  // Filter by id
  let c = components.find(c => c.id === id);

  // Render components
  let PluginComponent = this.__managers[c.type];

  // Validate dynamic import is loaded
  if (!PluginComponent) return null;
  return (
    <PluginComponent
      submodule={submodule}
      action={action}
      record={c}
      config={{ ...props, ...c.config_json }}
      core={this}
      actions={this.actions}
      as={as}
      utils={utils}
    />
  )
}

export default Core;
