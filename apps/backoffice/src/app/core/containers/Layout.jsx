import React, { useRef } from 'react';
import { connect } from 'react-redux';
import LayoutComponent from '../components/Layout'

function Layout(props) {

  const { history, backoffice, layout_toggle_menu, layout_wrapper_click } = props;

  const sidebar = useRef(null);
  const menuClick = useRef(false);

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

  return (
    <LayoutComponent
      { ...props }
      sidebar={sidebar}
      onWrapperClick={onWrapperClick}
      onSidebarClick={onSidebarClick}
      onToggleMenu={onToggleMenu}
    />
  )
}

export default connect(state => ({ backoffice: state.backoffice, auth: state.auth }))(Layout);