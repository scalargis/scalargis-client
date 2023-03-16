import React, {Component} from 'react';
import xml2js from 'xml2js';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

class WFS extends Component {

  /**
   * Event handler for load WFS Capabilities
   */
  loadWFSCapabilities() {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = this.props;
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
        data.dataitems = Models.OWSModel.convertWFS2Themes(capabilities, data.url, options);
        setData(data);

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wfs', data.url);
        setLoading(false);

      });
    }).catch((error) => {
      setData({ ...data, dataitems: [] });
      setError(''+error);
      setLoading(false);
    });
  }

  /**
   * On component did mount
   */
  componentDidMount() {
    const { data } = this.props;
    if (data.dataType === 'wfs' && data.url) {
      this.loadWFSCapabilities();
    }
  }

  /**
   * Render WFS wizard
   */
  render() {
    const { loading, data, editField, getUrlHistory, winSize } = this.props;
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
              this.loadWFSCapabilities()
            }}
          />
        </div>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>
      </React.Fragment>
    )
  }
}

export default WFS;