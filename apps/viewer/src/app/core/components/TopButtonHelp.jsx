import React, { useContext, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import { getWindowSize } from '../utils'

//let popupMenu;

function TopButtonHelp({ viewer }) {

  const { core } = useContext(AppContext);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  const isMobileSmall = wsize[0] <= 440;

  if (!viewer || !viewer.config_json || !viewer.config_json.help_url) return null;

  // Render help button
  return (
    <button className="p-link" title="Ajuda" onClick={e => { return; }}>
        <a href={viewer.config_json.help_url} target="_blank" style={{"color": "#ffffff"}}>
          <span className="layout-topbar-item-text">Ajuda</span>
          <span className="layout-topbar-icon pi pi-question-circle"/>
        </a>
    </button>
  )
}

export default connect(state => ({ viewer: state.root.viewer }))(TopButtonHelp)