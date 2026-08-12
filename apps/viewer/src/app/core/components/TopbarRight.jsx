import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, UnstyledButton } from '@mantine/core';

import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import { useWindowSize } from '../utils'
import * as Utils from '../utils';


// How much of the bar the strip is allowed to fill: everything except the bar's
// own padding and whatever else sits on the row. The strip is deliberately not
// part of this sum — that is what makes the answer stable. A figure that ignores
// the strip cannot change when the strip folds away, so folding can never
// manufacture the room that would unfold it again.
function spareRoomFor(bar, strip) {
  const style = getComputedStyle(bar);
  let room = bar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  for (const child of bar.children) {
    if (child === strip) continue;
    // The logo is taken out of the row, so it is not competing for the width.
    if (getComputedStyle(child).position === 'absolute') continue;
    room -= child.getBoundingClientRect().width;
  }
  return room;
}


export default function TopbarRight(props) {

  const { core, viewer, dispatch, mainMap } = props;

  const { t } = useTranslation();

  // Not read: the shell re-renders on resize (see useWindowSize), which is what
  // re-runs the measurement below.
  useWindowSize();

  let mobileMenu = viewer?.config_json?.topbar_right?.menu_mobile?.children?.length ? viewer.config_json.topbar_right.menu_mobile.children : [];

  if (viewer?.config_json?.components) {
    const ids = viewer?.config_json?.components.map(c => c.id);
    mobileMenu = mobileMenu.filter( c => ids.includes(c));
  }

  // Without a menu_mobile there is nowhere to fold the components away to, so
  // the strip is what it is and measuring it would only churn state.
  const canCollapse = mobileMenu.length > 0;

  const [collapsed, setCollapsed] = useState(false);
  // What the whole strip needs, remembered from when it was last all there:
  // once folded, the strip on screen is no longer the one being asked about.
  const fullWidth = useRef(null);

  // Measured on every render, deliberately undepended: the answer moves with
  // the viewport AND with the strip's own contents — signing in alone widens it
  // by a name — and a dependency list narrow enough to satisfy the linter would
  // stop re-measuring on exactly those. It cannot loop: `room` ignores the
  // strip, so folding does not change it, and a fold only happens when the
  // remembered width exceeds it. Unfolding re-measures and writes the truth
  // back, so a stale remembered width costs one extra pass and then settles.
  useLayoutEffect(() => {
    if (!canCollapse) return;
    const bar = document.querySelector('.layout-topbar');
    const strip = bar?.querySelector('.layout-topbar-icons');
    if (!bar || !strip) return;

    const room = spareRoomFor(bar, strip);

    if (!collapsed) {
      // Items never shrink (flex: none), so the strip's content width is the
      // width it actually wants.
      fullWidth.current = strip.scrollWidth;
      if (fullWidth.current > room) setCollapsed(true);
    } else if (fullWidth.current != null && fullWidth.current <= room) {
      setCollapsed(false);
    }
  });

  const isMobileSmall = canCollapse && collapsed;

  if (isMobileSmall) {
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