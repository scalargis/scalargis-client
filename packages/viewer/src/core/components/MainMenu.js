import React from 'react'
import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import * as Utils from '../utils';

export default function MainMenu(props) {

  const { components, history, core, viewer, dispatch, mainMap, auth, onMenuClick } = props;
  const { selected_menu } = viewer.config_json;

  function getStyle(c) {
    return { display: c.id !== selected_menu ? 'none' : 'block' }
  }

  return (
    <div className="layout-sidebar-panel">
      <div id="mainmenu"
        className="p-d-flex p-flex-column"
        onClick={onMenuClick}
        >
        <div>
          { core.renderMainMenu({
            selected_menu,
            props: { components, history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth }
          })}
        </div>
        <div className="p-mt-auto">
          { core.renderMainMenu({
            selected_menu,
            section: 'bottom',
            props: { components, history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth }
          })}
        </div>

      </div>

      <div id="content" className="p-d-flex p-flex-column p-jc-between">
        
        { core.renderComponents({
          id: selected_menu,
          region: 'mainmenu',
          props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth },
          as: 'panel',
          className: 'content-root',
          style: getStyle
        })}

        <div id="content-bottom">
          { core.renderComponents({
            id: selected_menu,
            region: 'mainmenu-bottom',
            props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth },
            as: ''
          })}          
        </div>

        { core.renderComponents({
          region: 'popup',
          props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth },
          as: 'popup'
        })}

      </div>
    </div>
  )
}