import React from 'react';
import { thunk } from 'redux-thunk';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import * as local_components from './core/components';
import * as core_components from '@scalargis/components';
import * as actions from './core/actions';
import * as utils from './core/utils';
import * as services from './core/service';
import * as pubsub from './core/pubsub';
import { importComponentModule } from './componentModules';
import ErrorBoundary from './core/components/ErrorBoundary';

import { initTranslations } from './core/i18n';
import { TourTarget } from '@scalargis/ui';
import { mainmenuButtonStep, mainmenuPanelStep, regionStep } from './onboarding/targets';

// Init translations
initTranslations();

/* -----------------------------------------------------------------------
   Target-binding helper (Phase 3).

   withTarget wraps element in a <TourTarget> when stepId resolves, or
   returns it unchanged otherwise. The key param goes on the wrapper so
   React can reconcile the array when TourTarget is the .map() child.
   ----------------------------------------------------------------------- */
function withTarget(stepId, element, key) {
  if (!stepId) return element;
  return React.createElement(TourTarget, { key, id: stepId }, element);
}

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
        for (const key of keysToRemove) {
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
      delete reducers_list[key]

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
   * Hold programatic site config
   */
  this.siteConfig = {
    loaded: false
  };

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
   * Hold Utils functions
   */
  this.utils = utils;

  /**
   * Hold Services functions
   */
  this.services = services;

  /**
   * Hold app components
   */
  this.__components = {};

  /**
   * Hold widget components
   */
  this.__widgets= {};

  /**
   * Hold menu components
   */
  this.__mainmenu = {};

  /**
   * Hold self onboarding steps by component type (Phase 5). An outside
   * component ships its own steps from its onboardingSteps export. addComponent
   * registers them here. useOnboardingSteps merges them with the base steps.
   */
  this.__onboardingSteps = {};

  /**
   * Hold the reducer keys the viewer components added
   */
  this.__reducerKeys = new Set();

  /**
   * Secure app props
   */
  this.__secureProps = ['config', 'actions', 'store', 'Renderer', '__components', '__widgets', '__mainmenu', '__onboardingSteps', '__reducerKeys'];
}

// Set core site config
Core.prototype.setSiteConfig = function(config) {
  this.siteConfig = {
    ...this.siteConfig,
    loaded: true,
    error: false,
    ...config
  }
}

// Set core config
Core.prototype.setConfig = function(config) {
  this.config = config;
}

/** Adds the actions, reducers, translations and registries of one component module to core. */
function registerComponentModule(core, type, c) {

  // Add component actions
  if (c.actions && typeof c.actions === 'object') {
    core.actions = {
      ...core.actions,
      ...c.actions
    };
  }

  // Add component reducers
  if (c.reducers && typeof c.reducers === 'object') {
    Object.entries(c.reducers).forEach(function([key, reducer]) {
      core.store.reducerManager.add(key, reducer);
      core.__reducerKeys.add(key);
    });
  }

  // Load component translations
  if (c.translations && typeof c.translations === 'object') {
    c.translations.load && c.translations.load();
  }

  // Registry Pattern: register react component in components registry
  if (!!c.default && !core.__components[type]) {
    core.__components[type] = c.default;
  }

  // Main menu registry
  if (!!c.MainMenu && !core.__mainmenu[type]) {
    core.__mainmenu[type] = c.MainMenu;
  }

  // Widgets registry
  if (!!c.widgets && !core.__widgets[type]) {
    core.__widgets[type] = c?.widgets;
  }

  // Self onboarding steps registry (Phase 5)
  if (Array.isArray(c.onboardingSteps) && !core.__onboardingSteps[type]) {
    core.__onboardingSteps[type] = c.onboardingSteps;
  }
}

/** Loads one viewer component. The promise always resolves, after it calls done. */
Core.prototype.addComponent = function(core, component, done) {

  const components = { ...local_components, ...core_components};

  const load = components[component.type]
    ? Promise.resolve(components[component.type])
    : importComponentModule(component.type);

  return load
    .then(c => registerComponentModule(core, component.type, c))
    .catch(err => console.error(`Error loading component "${component.type}":`, err))
    .finally(() => done && done());
}

/** Clears the components of the current viewer, with their reducers and actions. */
Core.prototype.unloadComponents = function() {
  this.__components = {}
  this.__onboardingSteps = {}
  this.__reducerKeys.forEach(key => this.store.reducerManager.remove(key));
  this.__reducerKeys = new Set();
  this.actions = actions;
}

/**
 * Self onboarding steps by component type (Phase 5). Returns the raw registry
 * { type: OnboardingStep[] } filled by addComponent from each component's
 * onboardingSteps export. useOnboardingSteps reads it, keeps the enabled types,
 * clones the steps, attaches the panel-reveal hooks, and merges with the base.
 */
Core.prototype.getOnboardingSelfSteps = function() {
  return this.__onboardingSteps || {};
}

Core.prototype.registerComponentWidgets = function (componentType, widgets) {
  // Widgets registry
  if (!!widgets && !this.__widgets[componentType]) {
    this.__widgets[componentType] = widgets;
  }
}

Core.prototype.renderMainMenu = function({ selected_menu, section, props }) {
  
  // Validate not empty components registry
  const keys = Object.keys(this.__mainmenu);
  if (keys.length === 0) return null;

  // From all components
  const { components } = this.config.config_json;

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
          const PluginComponent = this.__mainmenu[c.type];

          // Validate dynamic import is loaded
          if (!PluginComponent) return null;

          // The p-button-* tokens are the legacy active-state contract the
          // still-Prime plugin components read; `active` is the semantic prop
          // (MainMenuButton prefers it). The tokens leave when the last
          // decoupled component migrates (Phase 5).
          const active = selected_menu === c.id;
          const className = active ?
          "p-button-raised p-button-rounded" :
          "p-button-raised p-button-rounded p-button-outlined";

          const stepId = mainmenuButtonStep(c.type);
          const buttonEl = (
            <ErrorBoundary name={c.type}>
              <PluginComponent
                className={className}
                active={active}
                record={c}
                config={{ className, active, ...props, ...c.config_json }}
                core={this}
                actions={this.actions}
                utils={utils}
              />
            </ErrorBoundary>
          );

          return (
            <li key={c.id}>
              {withTarget(stepId, buttonEl, c.id)}
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
  const { components } = this.config.config_json;
  
  // Filter by id
  const c = components.find(c => c.id === id);

  // Render components
  const PluginComponent = this.__components[c.type];

  // Validate dynamic import is loaded
  if (!PluginComponent) return null;
  return (
    <ErrorBoundary name={c.type}>
      <PluginComponent
        record={c}
        config={{ ...props, ...c.config_json }}
        core={this}
        actions={this.actions}
        as={as}
        utils={utils}
      />
    </ErrorBoundary>
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
    const PluginComponent = this.__components[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;

    const classNameType = c.type ? `sg-type-${c.type.toLowerCase()}` : '';
    const classNameId = c.id ? `sg-id-${c.id}` : '';

    const stepId = region === 'mainmenu'
      ? mainmenuPanelStep(c.type)
      : regionStep(c.type, region);

    const cell = (
      <div key={c.id} className={`${className} ${classNameType} ${classNameId}`} style={style ? style(c) : null }>
        <ErrorBoundary name={c.type}>
          <PluginComponent
            record={c}
            config={{ ...props, ...c.config_json }}
            core={this}
            actions={this.actions}
            region={region}
            as={c.as || as}
            utils={utils}
          />
        </ErrorBoundary>
        { separator }
      </div>
    );
    return withTarget(stepId, cell, c.id);
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
    const PluginComponent = this.__components[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;

    const stepId = regionStep(c.type, region);

    const cell = (
      <div key={c.id} className={className} style={style ? style(c) : null }>
        <ErrorBoundary name={c.type}>
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
        </ErrorBoundary>
        { separator }
      </div>
    );
    return withTarget(stepId, cell, c.id);
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
    const PluginComponent = this.__components[c.type];

    // Validate dynamic import is loaded
    if (!PluginComponent) return null;

    const stepId = regionStep(c.type, region);

    const cell = (
      <div key={c.id} className={className} style={style ? style(c) : null }>
        <ErrorBoundary name={c.type}>
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
        </ErrorBoundary>
        { separator }
      </div>
    );
    return withTarget(stepId, cell, c.id);
  })
}

Core.prototype.getComponentWidget = function(widgeFullName) {
  const type = widgeFullName.split(".")[0]
  const widget = widgeFullName.split(".")[1]

  const Widget = this.__widgets?.[type]?.[widget];
  if (!Widget) return null;

  return Widget;
}

// Get auth from store
Core.prototype.getLoggedUser = function() {
  if (this.store) return this.store.getState()?.root?.auth?.data;
}

export default Core;
