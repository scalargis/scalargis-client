import React from 'react'
import { UnstyledButton } from '@mantine/core';
import { IconMenu } from '@scalargis/ui';
import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import * as Utils from '../utils';

export default function MainMenu(props) {

  const { mode, components, history, core, viewer, dispatch, mainMap, auth, onMenuClick } = props;
  const { layout_show_menu, layout_toggle_staticmenu, layout_toggle_menu, layout_wrapper_click } = core.actions;
  const { selected_menu } = viewer.config_json;

  function getStyle(c) {
    return { display: c.id !== selected_menu ? 'none' : 'block' }
  }

  return (
    <div className="layout-sidebar-panel">
      <div id="mainmenu"
        className="flex flex-column"
        onClick={onMenuClick}
        >
        { mode === 'embedded' && <div style={{"backgroundColor": "rgba(33, 150, 243, 0.92)", "textAlign": "center", "padding": "15px"}}>
          <UnstyledButton className="layout-menu-button" style={{"fontSize": "9px", color: "white"}} aria-label="Menu"
            onClick={e => {
              e.preventDefault();
              dispatch(layout_toggle_menu(true));
              //dispatch(layout_toggle_staticmenu());
            }}
          >
            <IconMenu style={{"fontSize": "2em"}} />
          </UnstyledButton>
        </div>}
        <div>
          { core.renderMainMenu({
            mode,
            selected_menu,
            props: { components, history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth }
          })}
        </div>
        <div className="mt-auto">
          { core.renderMainMenu({
            selected_menu,
            section: 'bottom',
            props: { components, history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils }, auth }
          })}
        </div>

      </div>

      <div id="content" className="flex flex-column justify-content-between">
        
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