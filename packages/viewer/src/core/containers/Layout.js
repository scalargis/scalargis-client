import React, { useRef, useEffect, useState } from 'react'
import { connect } from 'react-redux';
import ThemeSelector from '../components/ThemeSelector'
import LayoutComponent from '../components/Layout'
import { mapStateToProps, isDesktop } from '../utils'

function Layout(props) {

  const { core, history, config, viewer, mainOlMap, layout_toggle_menu, layout_wrapper_click } = props;

  const [activeTheme, setActiveTheme] = useState(null);

  let sidebar = useRef(null);
  let menuClick = useRef(false);

  function addClass(element, className) {
    if (element.classList) element.classList.add(className);
    else element.className += ' ' + className;
  }

  function removeClass(element, className) {
    if (element.classList) element.classList.remove(className);
    else element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }

  function onWrapperClick(event) {
    if (!menuClick.current) layout_wrapper_click();
    menuClick.current = false;
  }

  function onSidebarClick(event) {
    menuClick.current = true;
  }

  function onToggleMenu(event) {
    event.preventDefault();
    menuClick.current = true;
    layout_toggle_menu(isDesktop());
  }

  useEffect(() => {
    if (!config) return;

    // Set Theme
    let theme = process.env.REACT_APP_DEFAULT_THEME || 'default';
    if (config && config.theme) {
      theme = config.theme;
    }
    if (config && config.config_json && config.config_json.theme) {
      theme = config.config_json.theme;
    }
    setActiveTheme(theme);

    const { CLIENT_URL } = core;

    // -- Override document properties --//
    //Set Manifest
    let manifest_url = CLIENT_URL + 'manifest.json';    
    if (config.manifest_json) {
      let manifest = encodeURIComponent(JSON.stringify(config.manifest_json));
      manifest_url = "data:application/manifest+json,"+manifest;
    }
    let elem = document.querySelector("link[rel='manifest']");
    if (elem) {
      elem.href = manifest_url;
    } else {
      elem = document.createElement('link'); 
      elem.setAttribute('rel', 'manifest'); 
      elem.setAttribute('href', manifest_url); 
      document.querySelector('head').appendChild(elem);
    }

    //Set document title
    if (config.title) document.title = config.title;
    
    //Set document description
    if (config.description) {
      elem = document.querySelector("meta[name='description']");
      if (elem) elem.content = config.description; 
    }

    //Set document keywords
    if (config.keywords && config.keywords.length > 0) {
      elem = document.querySelector("meta[name='keywords']");      
      if (elem) elem.content = config.keywords.join(', ');
    }

    //Set document icons
    let icon_url = CLIENT_URL + 'assets/images/logo32.png';
    if (config.img_icon) {
      icon_url = CLIENT_URL + config.img_icon;
    }
    elem = document.querySelector("link[rel='shortcut icon']");
    if (!elem) elem = document.querySelector("link[rel='icon']");
    if (elem) {
      elem.href = icon_url;
    } else {
      elem = document.createElement('link'); 
      elem.setAttribute('rel', 'shortcut icon'); 
      elem.setAttribute('href', icon_url); 
      document.querySelector('head').appendChild(elem);        
    }

    icon_url = CLIENT_URL + 'assets/images/logo192.png';
    elem = document.querySelector("link[rel='apple-touch-icon']");
    if (elem) {
      elem.href = icon_url;
    } else {
      elem = document.createElement('link'); 
      elem.setAttribute('rel', 'apple-touch-icon'); 
      elem.setAttribute('href', icon_url); 
      document.querySelector('head').appendChild(elem);      
    }
  }, [config]);   

  useEffect(() => {
      if (viewer.mobileMenuActive) addClass(document.body, 'body-overflow-hidden');
      else removeClass(document.body, 'body-overflow-hidden');
      setTimeout(() => {
        if (mainOlMap) mainOlMap.updateSize(); // TODO: improve first map render check
      }, 210);
  }, [viewer]);

  return (
    <ThemeSelector theme={activeTheme}>
      <LayoutComponent
        { ...props }
        sidebar={sidebar}
        onWrapperClick={onWrapperClick}
        onSidebarClick={onSidebarClick}
        onToggleMenu={onToggleMenu}
      />
    </ThemeSelector>
  )
}

export default connect(state => {
  const gstate = mapStateToProps(state);
  return ({ config: gstate.config, viewer: gstate.viewer, auth: gstate.auth })
})(Layout);
