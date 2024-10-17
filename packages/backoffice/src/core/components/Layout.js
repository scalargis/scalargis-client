import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import classNames from 'classnames';
import { Routes, Route } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';

import { AppTopbar } from './AppTopbar';
import { AppFooter } from './AppFooter';
import { AppMenu } from './AppMenu';
import { AppProfile } from './AppProfile';
import { AppConfig } from './AppConfig';

//import { Dashboard } from './Dashboard';
import Dashboard from './Dashboard';

import AccountEdit from './account/AccountEdit';

import ModuleManager, {ModuleManagerRoutes} from './ModuleManager';

import NotificationEdit from './notifications/NotificationEdit';
import NotificationList from './notifications/NotificationList';

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

  const { CLIENT_URL } = core;

  const [inputStyle, setInputStyle] = useState('outlined');
  const [ripple, setRipple] = useState(false);

  const entityName = process.env.REACT_APP_ENTITY_NAME || 'Direção-Geral do Território';

  //const logo = layoutColorMode === 'dark' ? 'assets/layout/images/logo-white.svg' : 'assets/layout/images/logo.svg';
  const logo = backoffice.layoutColorMode === 'dark' ? 
    CLIENT_URL + 'assets/images/logo-light.png':
    CLIENT_URL + 'assets/images/logo.png';

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
                <div className="layout-logo" style={{cursor: 'pointer'}} onClick={() => history.navigate('/')}>
                    <img alt="Logo" src={logo} />
                </div>
                <AppProfile core={props.core} dispatch={props.dispatch} auth={props.auth} />
                <AppMenu model={menu} onMenuItemClick={onMenuItemClick} />
            </div>
        </CSSTransition>

        {/*<AppConfig rippleEffect={ripple} onRippleEffect={onRipple} inputStyle={inputStyle} onInputStyleChange={onInputStyleChange}
            layoutMode={backoffice.layoutMode} onLayoutModeChange={onLayoutModeChange} layoutColorMode={backoffice.layoutColorMode} onColorModeChange={onLayoutColorModeChange} />*/}

        <div className="layout-main">

            <Routes>

                <Route path="/account" element={AccountEdit} />

                <Route path="/notifications/edit/:id" element={NotificationEdit} />
                <Route path="/notifications/list" element={<NotificationList />} />

                <Route path="/" exact element={<Dashboard />} />
                <Route path="/dashboard" exact element={<div>Teste</div>} />
                
                <Route path="/viewers/create" element={<ViewerEdit />} />
                <Route path="/viewers/edit/:id" element={<ViewerEdit />} />
                <Route path="/viewers/list" element={<ViewerList />} />

                <Route path="/prints/create" element={<PrintEdit />} />
                <Route path="/prints/edit/:id" element={<PrintEdit />} />
                <Route path="/prints/list" element={<PrintList />} />
                <Route path="/prints/groups/create" element={<PrintGroupEdit />} />
                <Route path="/prints/groups/edit/:id" element={<PrintGroupEdit />} />         
                <Route path="/prints/groups/list" element={<PrintGroupList />} />
                <Route path="/prints/elements/create" element={<PrintElementEdit />} />
                <Route path="/prints/elements/edit/:id" element={<PrintElementEdit />} />            
                <Route path="/prints/elements/list" element={<PrintElementList />} />                      

                {/*
                <Route path="/modules/:id/:sub?/:action?" render={(props) => {
                    return (
                        <ModuleManager {...props}
                        core={core}
                        module={props.match.params.id}
                        submodule={props.match.params.sub}
                        action={props.match.params.action} />
                    )
                }} />
                */}
                <Route path="/modules/:module/:submodule?/:action?" element={<ModuleManager 
                    core={core} history={history} dispatch={dispatch} backoffice={backoffice} />} />

                {}          

                <Route path="/security/users/create" element={<UserEdit />}  />
                <Route path="/security/users/edit/:id" element={<UserEdit />} />             
                <Route path="/security/users/list" element={<UserList />} />
                <Route path="/security/roles/create" element={<RoleEdit />}  />
                <Route path="/security/roles/edit/:id" element={<RoleEdit />} />                
                <Route path="/security/roles/list" element={ <RoleList />} />
                <Route path="/security/groups/create" element={<GroupEdit />}  />
                <Route path="/security/groups/edit/:id" element={<GroupEdit />} />                
                <Route path="/security/groups/list" element={<GroupList />} />             
                <Route path="/settings/parameters/create" element={<ParameterEdit />}  />
                <Route path="/settings/parameters/edit/:id" element={<ParameterEdit />} />            
                <Route path="/settings/parameters/list" element={<ParameterList parametersTable='site' />} />             
                <Route path="/settings/coordinate_systems/create" element={<CoordinateSystemEdit />}  />
                <Route path="/settings/coordinate_systems/edit/:id" element={<CoordinateSystemEdit />} />
                <Route path="/settings/coordinate_systems/list" element={<CoordinateSystemList />} />
            </Routes>
        </div>

        <AppFooter />

    </div>

  );

}

export default Layout;