import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import classNames from 'classnames';
import { withRouter, Route, useHistory } from 'react-router-dom';
//import AppContext from '../../AppContext';
import { CSSTransition } from 'react-transition-group';

import { AppTopbar } from './AppTopbar';
import { AppFooter } from './AppFooter';
import { AppMenu } from './AppMenu';
import { AppProfile } from './AppProfile';
import { AppConfig } from './AppConfig';

//import { Dashboard } from './Dashboard';
import Dashboard from './Dashboard';

import AccountEdit from './account/AccountEdit';

import ModuleManager from './ModuleManager';

import ViewerEdit from './viewers/ViewerEdit';
import ViewerList from './viewers/ViewerList';

import PrintEdit from './prints/PrintEdit';
import PrintList from './prints/PrintList';
import PrintGroupEdit from './prints/PrintGroupEdit';
import PrintGroupList from './prints/PrintGroupList';
import PrintElementEdit from './prints/PrintElementEdit';
import PrintElementList from './prints/PrintElementList';

import UserList from './security/UserList';
import UserEdit from './security/UserEdit';

import RoleList from './security/RoleList';
import RoleEdit from './security/RoleEdit';

import GroupList from './security/GroupList';
import GroupEdit from './security/GroupEdit';

import ParameterList from './settings/ParameterList';
import ParameterEdit from './settings/ParameterEdit';

import CoordinateSystemList from './settings/CoordinateSystemList';
import CoordinateSystemEdit from './settings/CoordinateSystemEdit';

import PrimeReact from 'primereact/api';

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'prismjs/themes/prism-coy.css';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import '../../layout/flags/flags.css';
import '../../layout/layout.scss';
import './App.scss';

function Layout(props) {

  const {
    core,
    history,
    dispatch,
    backoffice,
    sidebar,
    onWrapperClick,
    onSidebarClick,
    onToggleMenu,
    onLayoutModeChange,
    onLayoutColorModeChange
  } = props;

  const [inputStyle, setInputStyle] = useState('outlined');
  const [ripple, setRipple] = useState(false);
  
  const viewersFilter = useRef(null);

  const entityName = process.env.REACT_APP_ENTITY_NAME || 'Direção-Geral do Território';

  //const logo = layoutColorMode === 'dark' ? 'assets/layout/images/logo-white.svg' : 'assets/layout/images/logo.svg';
  const logo = backoffice.layoutColorMode === 'dark' ? 
    (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo.png':
    (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo.png';

  /*
  const wrapperClass = classNames('layout-wrapper', {
      'layout-overlay': layoutMode === 'overlay',
      'layout-static': layoutMode === 'static',
      'layout-static-sidebar-inactive': staticMenuInactive && layoutMode === 'static',
      'layout-overlay-sidebar-active': overlayMenuActive && layoutMode === 'overlay',
      'layout-mobile-sidebar-active': mobileMenuActive,
      'p-input-filled': inputStyle === 'filled',
      'p-ripple-disabled': ripple === false
  });
  const sidebarClassName = classNames('layout-sidebar', {
      'layout-sidebar-dark': layoutColorMode === 'dark',
      'layout-sidebar-light': layoutColorMode === 'light'
  });
  */
  const wrapperClass = classNames('layout-wrapper', {
    'layout-overlay': backoffice.layoutMode === 'overlay',
    'layout-static': backoffice.layoutMode === 'static',
    'layout-static-sidebar-inactive': backoffice.staticMenuInactive && backoffice.layoutMode === 'static',
    'layout-overlay-sidebar-active': backoffice.overlayMenuActive && backoffice.layoutMode === 'overlay',
    'layout-mobile-sidebar-active': backoffice.mobileMenuActive,
    'p-input-filled': inputStyle === 'filled',
    'p-ripple-disabled': ripple === false    
  });

  const sidebarClassName = classNames("layout-sidebar", {
    'layout-sidebar-dark': backoffice.layoutColorMode === 'dark',
    'layout-sidebar-light': backoffice.layoutColorMode === 'light'
  });

  /*-----------------------------------------------------*/

  const isDesktop = () => {
      return window.innerWidth > 1024;
  }

  const isSidebarVisible = () => {
      if (isDesktop()) {
          //if (layoutMode === 'static')
          if (backoffice.layoutMode === 'static')
              //return !staticMenuInactive;
              return !backoffice.staticMenuInactive
          //else if (layoutMode === 'overlay')
          else if (backoffice.layoutMode === 'overlay')
              //return overlayMenuActive;
              return backoffice.overlayMenuActive
          else
              return true;
      }

      return true;
  }

  const onMenuItemClick = (event) => {
      if (!event.item.items) {
          //setOverlayMenuActive(false);
          //setMobileMenuActive(false);
      }
  }

  const onInputStyleChange = (inputStyle) => {
      setInputStyle(inputStyle);
  }

  const onRipple = (e) => {
      PrimeReact.ripple = e.value;
      setRipple(e.value)
  }

  let menu = [];
  if (backoffice && backoffice.config_json && backoffice.config_json.menu) {
      menu = backoffice.config_json.menu;
  }

  return (

    <div className={wrapperClass} onClick={onWrapperClick}>
        <AppTopbar onToggleMenu={onToggleMenu} />

        <CSSTransition classNames="layout-sidebar" timeout={{ enter: 200, exit: 200 }} in={isSidebarVisible()} unmountOnExit>
            <div ref={sidebar} className={sidebarClassName} onClick={onSidebarClick}>
                <div className="layout-logo" style={{cursor: 'pointer'}} onClick={() => history.push('/')}>
                    <img alt="Logo" src={logo} />
                </div>
                <AppProfile core={props.core} dispatch={props.dispatch} auth={props.auth} />
                <AppMenu model={menu} onMenuItemClick={onMenuItemClick} />
            </div>
        </CSSTransition>

        <AppConfig rippleEffect={ripple} onRippleEffect={onRipple} inputStyle={inputStyle} onInputStyleChange={onInputStyleChange}
            layoutMode={backoffice.layoutMode} onLayoutModeChange={onLayoutModeChange} layoutColorMode={backoffice.layoutColorMode} onColorModeChange={onLayoutColorModeChange} />

        <div className="layout-main">

            <Route path="/account" component={AccountEdit} />

            <Route path="/" exact component={Dashboard} />
            <Route path="/dashboard" exact component={Dashboard} />

            <Route path="/viewers/create" component={ViewerEdit} />
            <Route path="/viewers/edit/:id" component={ViewerEdit} />
            <Route path="/viewers/list" render={(props) => (
                <ViewerList {...props} viewersFilter={viewersFilter.current} saveViewersFilter={(filter) => {viewersFilter.current = filter;}} />
            )} />

            <Route path="/prints/create" component={PrintEdit} />
            <Route path="/prints/edit/:id" component={PrintEdit} />
            <Route path="/prints/list" render={(props) => (
                <PrintList {...props}  />
            )} />
            <Route path="/prints/groups/create" component={PrintGroupEdit} />
            <Route path="/prints/groups/edit/:id" component={PrintGroupEdit} />         
            <Route path="/prints/groups/list" render={(props) => (
                <PrintGroupList {...props}  />
            )} />             
            <Route path="/prints/elements/create" component={PrintElementEdit} />
            <Route path="/prints/elements/edit/:id" component={PrintElementEdit} />            
            <Route path="/prints/elements/list" render={(props) => (
                <PrintElementList {...props} />
            )} />                      

            <Route path="/modules/:id" render={(props) => (
                <ModuleManager {...props} core={core} module='cadastro' />
            )} />

            <Route path="/security/users/create" component={UserEdit}  />
            <Route path="/security/users/edit/:id" component={UserEdit} />             
            <Route path="/security/users/list" render={(props) => (
                <UserList {...props} />
            )} />
            <Route path="/security/roles/create" component={RoleEdit}  />
            <Route path="/security/roles/edit/:id" component={RoleEdit} />                
            <Route path="/security/roles/list" render={(props) => (
                <RoleList {...props} />
            )} />
            <Route path="/security/groups/create" component={GroupEdit}  />
            <Route path="/security/groups/edit/:id" component={GroupEdit} />                
            <Route path="/security/groups/list" render={(props) => (
                <GroupList {...props} />
            )} />             
            <Route path="/settings/parameters/create" component={ParameterEdit}  />
            <Route path="/settings/parameters/edit/:id" component={ParameterEdit} />            
            <Route path="/settings/parameters/list" render={(props) => (
                <ParameterList {...props} parametersTable='site' />
            )} />             
            <Route path="/settings/coordinate_systems/create" component={CoordinateSystemEdit}  />
            <Route path="/settings/coordinate_systems/edit/:id" component={CoordinateSystemEdit} />
            <Route path="/settings/coordinate_systems/list" render={(props) => (
                <CoordinateSystemList {...props} />
            )} />            
        </div>

        <AppFooter />

    </div>

  );

}

export default Layout;