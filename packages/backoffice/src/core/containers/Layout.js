import React, { useRef, useState, useEffect } from 'react'
import LayoutComponent from '../components/Layout'
import { connect } from 'react-redux'
import { withRouter, Route, useHistory } from 'react-router-dom';

function Layout(props) {

  const { history, backoffice, layout_toggle_menu, layout_wrapper_click, layout_set_mode, layout_set_colormode } = props;
  let sidebar = useRef(null);
  let menuClick = useRef(false);

  const addClass = (element, className) => {
    if (element.classList)
        element.classList.add(className);
    else
        element.className += ' ' + className;
  }

  const removeClass = (element, className) => {
    if (element.classList)
        element.classList.remove(className);
    else
        element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }

  const isDesktop = () => {
      return window.innerWidth > 1024;
  }

  const onWrapperClick = (event) => {
      /*
      if (!menuClick.current) {
          setOverlayMenuActive(false);
          setMobileMenuActive(false);
      }
      menuClick.current = false;
      */
    if (!menuClick.current) layout_wrapper_click();
    menuClick.current = false;      
  }

  const onSidebarClick = () => {
    menuClick.current = true;
  }

  const onToggleMenu = (event) => {
    /*
    menuClick.current = true;

    if (isDesktop()) {
        if (layoutMode === 'overlay') {
            setOverlayMenuActive(prevState => !prevState);
        }
        else if (layoutMode === 'static') {
            setStaticMenuInactive(prevState => !prevState);
        }
    }
    else {
        setMobileMenuActive(prevState => !prevState);
    }
    event.preventDefault();
    */
    event.preventDefault();
    menuClick.current = true;
    layout_toggle_menu(isDesktop());      
  }

  const onLayoutModeChange = (mode) => {
      layout_set_mode(mode);
  }

  const onLayoutColorModeChange = (mode) => {
      layout_set_colormode(mode);
  }  

  return (
    <LayoutComponent
      { ...props }
      sidebar={sidebar}
      onWrapperClick={onWrapperClick}
      onSidebarClick={onSidebarClick}
      onToggleMenu={onToggleMenu}
      onLayoutModeChange={onLayoutModeChange}
      onLayoutColorModeChange={onLayoutColorModeChange}
    />
  )
}

export default connect(state => ({ backoffice: state.backoffice, auth: state.auth }))(withRouter(Layout));