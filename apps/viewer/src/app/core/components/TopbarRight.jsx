import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, UnstyledButton } from '@mantine/core';

import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import { getWindowSize } from '../utils'
import * as Utils from '../utils';


export default function TopbarRight(props) {

  const { core, viewer, dispatch, mainMap } = props;

  const { t } = useTranslation();

  const wsize = getWindowSize();
  const isMobileSmall = wsize[0] <= 440;

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
    });

    return(
      <React.Fragment>
        { core.renderComponents({
          region: 'topbar_right',
          mobileMenu: mobileMenu,
          props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } }
        })}

        { mobileMenu?.length ?
          <div className="topbar-menu-button-container">
            {/* The dropdown holds whole components (each renders its own
                interactive row), so they mount as plain children, not
                Menu.Item — a Menu.Item is itself a button and would nest
                interactives.

                Rows own the open state of the dialogs they launch, so the
                dropdown has to stay mounted: a dialog portals out to the body,
                its own clicks then read as outside clicks here, and unmounting
                the dropdown on close would take the row — and the dialog it is
                still showing — with it. display-none hiding keeps the row's
                state and effects alive; the Activity default would drop the
                effects. */}
            <Menu position="bottom-end" shadow="md" keepMounted keepMountedMode="display-none">
              <Menu.Target>
                <UnstyledButton className="layout-menu-button" aria-label={t("options", "Opções")}>
                  <span className="pi pi-chevron-circle-down"/>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown id="topbar_right_menu">
                {(menuItems || []).map((c, k) => <div key={k} className="sg-topbar-menuitem">{c}</div>)}
              </Menu.Dropdown>
            </Menu>
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