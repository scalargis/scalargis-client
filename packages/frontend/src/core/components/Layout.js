import React from 'react'
import classNames from 'classnames'
import {AppTopbar} from './AppTopbar'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import { getWindowSize } from '../utils'
import Script, {ScriptHtml} from './Script'
import Style, {StyleHtml} from './Style'


function Layout(props) {

  const {
    config,
    viewer,
    sidebar,
    onWrapperClick,
    onSidebarClick,
    onToggleMenu
  } = props;

  const entityName = process.env.REACT_APP_ENTITY_NAME || 'Direção-Geral do Território';

  const wrapperClass = classNames('layout-wrapper', {
    'layout-overlay': viewer.layoutMode === 'overlay',
    'layout-static': viewer.layoutMode === 'static',
    'layout-static-sidebar-inactive': viewer.staticMenuInactive && viewer.layoutMode === 'static',
    'layout-overlay-sidebar-active': viewer.overlayMenuActive && viewer.layoutMode === 'overlay',
    'layout-mobile-sidebar-active': viewer.mobileMenuActive
  }, config?.config_json?.layout_class || config?.layout_class);

  const sidebarClassName = classNames("layout-sidebar", {
    'layout-sidebar-dark': viewer.layoutColorMode === 'dark',
    'layout-sidebar-light': viewer.layoutColorMode === 'light'
  });

  // Use window width for sidebar in mobile
  const size = getWindowSize();

  let logo = viewer.layoutColorMode === 'dark' ?
    (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo_light.png':
    (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo.png';

  if (config && config.img_logo) {
    logo = (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + config.img_logo;
  }

  let title_logo = null;

  if (config && config.title_logo) {
    title_logo = config.title_logo;
  }
  if (config && config.config_json && config.config_json.title_logo)  {
    title_logo = config.config_json.title_logo;
  }

  const logoComponent = size[0] > 768 ? <div className="layout-logo">
      <img alt="Logo" src={logo} />
      { title_logo ?
        <div dangerouslySetInnerHTML={{__html: title_logo }}></div> : null
      }
    </div> : null

  return (
    <div className={wrapperClass} onClick={onWrapperClick}>
        <AppTopbar onToggleMenu={onToggleMenu} logo={logoComponent} regionComponents={props.topbarRight} />

        <div ref={(el) => sidebar.current = el} 
          className={sidebarClassName} 
          onClick={onSidebarClick}
          style={{ width: viewer.mobileMenuActive && size[0] <= 768 ? size[0] : null }}
          >
            { viewer.mobileMenuActive &&
            <div className="layout-logo">
                { title_logo ?
                  <div dangerouslySetInnerHTML={{__html: title_logo }}></div> : null
                }
                <img alt="Logo" src={logo} />
            </div>
            }

            { props.mainMenu }

        </div>

        <div className="layout-main">
            { props.children }
        </div>

        <div className="layout-footer">
            <div className="footer-right">
                { props.footerRight }
            </div>
            <span className="footer-text" style={{'marginRight': '5px'}}>&copy; 2021 {entityName}</span>
        </div>

        <div className="layout-mask"></div>

        { (config && config.scripts) ? config.scripts.map((k, i) => <Script key={i} src={k} async={false} />) : null }
        { (config && config.styles) ? config.styles.map((k, i) => <Style key={i} src={k} async={false} />) : null }
        
        { (config && config.custom_style) ? <StyleHtml style={config.custom_style} /> : null}
        { (config && config.custom_script) ? <ScriptHtml code={config.custom_script} /> : null}

    </div>
  );
}

export default Layout;
