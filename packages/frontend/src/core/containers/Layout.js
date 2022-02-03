import React, { useRef, useEffect, useState } from 'react'
import { connect } from 'react-redux';
import LayoutComponent from '../components/Layout'
import { mapStateToProps } from '../utils'

const ThemeSelector = ({ theme, children }) => {
  let Theme = null;

  if (!theme || theme === 'default') {
    Theme = React.lazy(() => import('../../themes/default/main'));
  } else {
    Theme = React.lazy(() => import('../../themes/' + theme + '/src/main'));
  }

  return (
    <>
      <React.Suspense fallback={<></>}>
        <Theme />
      </React.Suspense>
      {children}
    </>
  )
}

function Layout(props) {

  const { history, config, viewer, mainOlMap, layout_toggle_menu, layout_wrapper_click } = props;

  let sidebar = useRef(null);
  let menuClick = useRef(false);

  // Set Theme
  let theme = process.env.REACT_APP_DEFAULT_THEME || 'default';
  if (config && config.theme) {
    theme = config.theme;
  }
  if (config && config.config_json && config.config_json.theme) {
    theme = config.config_json.theme;
  }

  function addClass(element, className) {
    if (element.classList) element.classList.add(className);
    else element.className += ' ' + className;
  }

  function removeClass(element, className) {
    if (element.classList) element.classList.remove(className);
    else element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }

  function isDesktop() {
    return window.innerWidth > 1024;
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

    const CLIENT_URL = (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '');

    // -- Override document properties --//
    //Set document title
    if (config.title) document.title = config.title;
    //Set document description
    if (config.description) {
      let elem = document.querySelector("meta[name='description']");
      if (elem) elem.content = config.description; 
    }
    //Set document keywords
    if (config.keywords && config.keywords.length > 0) {
      let elem = document.querySelector("meta[name='keywords']");      
      if (elem) elem.content = config.keywords.join(', ');
    }
    //Set document icons
    if (config.img_icon) {
      //document.querySelector("link[rel*='icon']").href = "favicon.ico"
      let elem = document.querySelector("link[rel='shortcut icon']");
      //if (elem) elem.href = CLIENT_URL + '/assets/images/dgt/logo32.png';
      if (elem) elem.href = CLIENT_URL + config.img_icon;

      elem = document.querySelector("link[rel='apple-touch-icon']");
      //if (elem) elem.href = CLIENT_URL + '/assets/images/dgt/logo32.png';
      if (elem) elem.href = CLIENT_URL + config.img_icon;
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
    <ThemeSelector theme={theme}>
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
