import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";

import xml2js from 'xml2js';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';


export default function WFS(props) {

  const { t } = useTranslation(); 

  useEffect(() => {
    if (props?.data?.dataType === 'wfs' && props?.data?.url) {
      loadWFSCapabilities();
    }
  }, [props?.data?.dataType]);


  /**
   * Event handler for load WFS Capabilities
   */
  const loadWFSCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl } = Models.Utils;
    if (!data.url) return;

    let srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    let bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    let options = {
      srid: srid,
      bbox: bbox
    }
    
    let turl = data.url;
    turl = turl.replace(/request=getcapabilities/ig, '');
    turl = turl.replace(/service=wfs/ig, '')
    turl = turl + (turl.indexOf('?') > -1 ? '' : '?')
    turl = turl + '&SERVICE=WFS&REQUEST=GetCapabilities';

    //Add user authentication token
    if (isUrlAppHostname(turl) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        turl = turl + '&' + authkey + '=' + auth.data.auth_token;
      }
    }

    if (!isUrlAppOrigin(turl)) {
      turl = core.MAP_PROXY_URL + encodeURIComponent(turl);
    };

    setLoading(true);

    fetch(turl)
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      xml2js.parseString(r, (err, capabilities) => {
        if (err) {
          console.error(err);
          setError(''+err);
          setLoading(false);
          return;
        }
        //data.dataitems = Models.OWSModel.convertWFS2Themes(capabilities, data.url, options);
        let dataitems = Models.OWSModel.convertWFS2Themes(capabilities, data.url, options);
        //setData(data);
        setData({ ...data, dataType: undefined, dataitems });

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wfs', data.url);
        setLoading(false);

      });
    }).catch((error) => {
      setData({ ...data, dataType: undefined, dataitems: [] });
      setError(''+error);
      setLoading(false);
    });
  }

  /**
   * Render WFS wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory, winSize } = props;
    return (
      <React.Fragment>
        <div className="p-inputgroup">
          <InputText placeholder='http://...'
            value={data.url}
            list='urlhistory'
            onChange={e => editField('url', e.target.value.trim())}
          />
          <Button
            icon={ loading ? "pi pi-spin pi-spinner" : "pi pi-search" }
            tooltip="Carregar" tooltipOptions={{position: 'bottom'}}
            disabled={loading}
            onClick={e => {
              e.preventDefault();
              loadWFSCapabilities()
            }}
          />
        </div>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>
      </React.Fragment>
    )
  }

  return render();

}