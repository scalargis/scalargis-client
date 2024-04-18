import React, { useState, useRef } from 'react';

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

    return(
      <React.Fragment>
        { core.renderComponents({
          region: 'topbar_right',
          mobileMenu: mobileMenu,
          props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } }
        })}

        { mobileMenu?.length ? <div ref={menuRef} className="topbar-menu-button-container">
          <button className="p-link layout-menu-button" onClick={(event) => setShowMenu(!showMenu)}>
            <span className="pi pi-chevron-circle-down"/>
          </button>
          {showMenu && 
            <div className="p-menu p-component p-menu-overlay p-mt-2" style={{zIndex: "1001", position: "absolute", right: "10px"}}>
              <ul className="p-menu-list p-reset" role="menu">
                { core.renderComponentsMenu({
                    region: 'topbar_right',
                    mobileMenu: mobileMenu,
                    props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
                  }).map((c, k) => <li key={k} className="p-menuitem" role="none">{c}</li>) }
              </ul>
            </div>
          }
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