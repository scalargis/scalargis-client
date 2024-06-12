import React,  {useState, useEffect} from 'react'
import { useTranslation } from "react-i18next"
import classNames from 'classnames'
import {AppTopbar} from './AppTopbar'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import { getWindowSize, buildRelativeUrlPath } from '../utils'
import Script, {ScriptWithProps, ScriptHtml} from './Script'
import Style, {StyleHtml} from './Style'
import LoadingScreen from './LoadingScreen'
import EventManager from '../events/EventManager'
import AppNotification from './AppNotification'

function Layout(props) {

  const {
    core,
    config,
    viewer,
    sidebar,
    notifications,
    onWrapperClick,
    onSidebarClick,
    onToggleMenu
  } = props;

  const { t } = useTranslation(["common", "custom"]);
	
  const { CLIENT_URL } = core;

  const [loaded, setLoaded] = useState(false);


  useEffect(() => {
    if (!config) return;
    if (!config.custom_style) setLoaded(true);
  }, [config]);

  const copyrightYear = new Date().getFullYear();
  const entityName = process.env.REACT_APP_ENTITY_NAME;
  const entityUrl = process.env.REACT_APP_ENTITY_URL;

  const showLogoMobile = viewer?.config_json?.mobile_show_logo === false ? false : true;


  const wrapperClass = classNames('layout-wrapper', {
    'layout-overlay': viewer.layoutMode === 'overlay',
    'layout-static': viewer.layoutMode === 'static',
    'layout-static-sidebar-inactive': viewer.staticMenuInactive && viewer.layoutMode === 'static',
    'layout-overlay-sidebar-active': viewer.overlayMenuActive && viewer.layoutMode === 'overlay',
    'layout-mobile-sidebar-active': viewer.mobileMenuActive,
    'layout-mobile-sidebar-no-logo': viewer.mobileMenuActive && !showLogoMobile
  }, config?.config_json?.layout_class || config?.layout_class);

  const sidebarClassName = classNames("layout-sidebar", {
    'layout-sidebar-dark': viewer.layoutColorMode === 'dark',
    'layout-sidebar-light': viewer.layoutColorMode === 'light'
  });

  // Use window width for sidebar in mobile
  const size = getWindowSize();

  let logo = viewer.layoutColorMode === 'dark' ?
    CLIENT_URL + 'assets/images/logo-light.png':
    CLIENT_URL + 'assets/images/logo.png';

  if (viewer.staticMenuInactive && viewer.layoutMode === 'static') {
    logo = CLIENT_URL + 'assets/images/logo-light.png';
  }

  if (config && config.img_logo) {
    logo = buildRelativeUrlPath(config.img_logo);
  }

  if (config && config.img_logo_alt &&  viewer.staticMenuInactive && viewer.layoutMode === 'static') {
    logo = buildRelativeUrlPath(config.img_logo_alt);
  }

  let title_logo = null;

  if (config && config.title_logo) {
    title_logo = config.title_logo;
  }
  if (config && config.config_json && config.config_json.title_logo)  {
    title_logo = config.config_json.title_logo;
  }

  //Translate title
  if (title_logo) {
    title_logo = t(title_logo, title_logo, {"ns": "custom"});
  }

  const logoComponent = size[0] > 768 ? <div className="layout-logo">
      <img alt="Logo" src={logo} />
      { title_logo ?
        <div dangerouslySetInnerHTML={{__html: title_logo }}></div> : null
      }
    </div> : null


  return (
    <div className={wrapperClass} onClick={onWrapperClick}>

        <EventManager
          mainMap={props.mainOlMap}
          viewer={props.viewer}
          core={props.core}
          dispatch={props.dispatch}
        />

        <AppNotification
          notifications={props.notifications}
          filterGroups={[]}
        />

        { loaded && <AppTopbar onToggleMenu={onToggleMenu} logo={logoComponent} regionComponents={props.topbarRight} /> }

        <div ref={(el) => sidebar.current = el} 
          className={sidebarClassName} 
          onClick={onSidebarClick}
          style={{ width: viewer.mobileMenuActive && size[0] <= 768 ? size[0] : null }}
          >
            { viewer.mobileMenuActive && showLogoMobile &&
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

        { loaded && <div className="layout-footer">
            <div className="footer-left">
              { entityName && (
                entityUrl ? 
                <span className="footer-text">&copy; {copyrightYear} <a href={entityUrl} target="_blank" rel="noopener noreferrer">{entityName}</a></span>  
                : <span className="footer-text">&copy; {copyrightYear} {entityName}</span>
              )}
              <div>
                { props.footerLeft }
              </div>
            </div>
            <div className="footer-right">
                { props.footerRight }
            </div>
        </div> }

        <div className="layout-mask"></div>

        { !loaded && <LoadingScreen /> }

        {/*{ (config && config.scripts) ? config.scripts.map((k, i) => <Script key={i} src={k} async={false} />) : null }*/}
        { (config && config.scripts) ? config.scripts.map((k, i) => {
            if (typeof k === 'object' && k !== null) {
              return <ScriptWithProps key={i} {...k} />
            } else {
              return <Script key={i} src={k} async={false} />
            }
          }) : null
        }
        { (config && config.styles) ? config.styles.map((k, i) => <Style key={i} src={k} async={false} />) : null }
        
        { (config && config.custom_style) ? <StyleHtml style={config.custom_style} 
            onLoaded={()=>{setTimeout(()=>setLoaded(true), 500);}} /> : null }
        { (config && config.custom_script) ? <ScriptHtml code={config.custom_script} /> : null }

    </div>
  );
}

export default Layout;
