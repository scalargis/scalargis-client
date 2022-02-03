import React, { Fragment, useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import Cookies from 'universal-cookie'
import { InputSwitch } from 'primereact/inputswitch'
import { Button } from 'primereact/button'
import './index.css'

const cookiePopupName = process.env.REACT_APP_COOKIE_POPUP_NAME || 'websig_dgt_popup';

export default function Main({ config, actions, utils }) {

  function getInitialState() {
    let state = true;
    const cookies = new Cookies();
    const cookieData = cookies.get(config.cookieName || cookiePopupName);
    if (typeof cookieData !== 'undefined') {
      let data = JSON.parse(cookieData);
      state = data === 0 ? false : true;
    }
    return state;
  }

  const { showOnPortal } = utils;

  const [showPopup, setShowPopup] = useState(false);
  const [permanent, setPermanent] = useState(false);

  const wsize = utils.getWindowSize();
  const isMobile = wsize[0] <= 768;

  function hidePopup() {
    setShowPopup(false);
    let data = JSON.stringify(0);
    const cookies = new Cookies();
    let maxAge = 1;
    if (permanent) maxAge = config.maxAge || (maxAge * 365 * 24 * 60 * 60);
    cookies.set(config.cookieName || cookiePopupName, data, { maxAge });
  }

  useEffect(() => {
    let state = getInitialState();
    setShowPopup(state);
  }, []);
  
  // Render content
  const closeLabel = config.closeLabel || "Fechar";
  return (
    <Fragment>
      {showOnPortal(<Dialog
        header={config.header}
        visible={showPopup}
        style={{width: isMobile ? '90%' : '35vw' }}
        modal
        footer={(
          <div className="p-grid">
            {(config.hideOption &&
            <div className="p-col" style={{ textAlign: 'left'}}>
              <InputSwitch
                inputId="permanentSwitch"
                checked={permanent}
                onChange={(e) => setPermanent(!permanent)}
              />
              {' '}
              <label htmlFor="permanentSwitch">
                <span>Não mostrar novamente</span>
              </label>
            </div>)}
            <div className="p-col" style={{ textAlign: 'right'}}>
              <Button label={closeLabel} onClick={e => setShowPopup(false)} />
            </div>
          </div>
        )}
        onHide={e => hidePopup()}>
          <div dangerouslySetInnerHTML={{ __html: config.html }}></div>
      </Dialog>)}
    </Fragment>
  )
}
