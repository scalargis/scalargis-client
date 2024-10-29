import React, { useState, useRef } from 'react';
import { Menu } from 'primereact/menu';

import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import { getWindowSize } from '../utils'
import * as Utils from '../utils';


export default function TopbarRight(props) {

  const { core, viewer, dispatch, mainMap } = props;

  const [showMenu, setShowMenu] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  const isMobileSmall = wsize[0] <= 440;

  const menuRef = useRef();

  if (isMobileSmall) {
    let mobileMenu = viewer?.config_json?.topbar_right?.menu_mobile?.children?.length ? viewer.config_json.topbar_right.menu_mobile.children : [];

    if (viewer?.config_json?.components) {
      const ids = viewer?.config_json?.components.map(c => c.id);
      mobileMenu = mobileMenu.filter( c => ids.includes(c));
    }

    const menuItems = core.renderComponentsMenu({
      region: 'topbar_right',
      mobileMenu: mobileMenu,
      props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
    }).map((c, k) => { return { template: <div className='p-menuitem-content'>{c}</div>} }); 

    return(
      <React.Fragment>
        { core.renderComponents({
          region: 'topbar_right',
          mobileMenu: mobileMenu,
          props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } }
        })}
  
        { mobileMenu?.length ?
          <div className="topbar-menu-button-container">
            <Menu model={menuItems} popup ref={menuRef} id="topbar_right_menu" /> 
            <button className="p-link layout-menu-button" onClick={(event) => menuRef.current.toggle(event)}>
              <span className="pi pi-chevron-circle-down"/>
            </button>
          </div> : null }
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'topbar_right',
        props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } }
      })}
      
    </React.Fragment>
  )
}