import React, {Component} from 'react';
import { WMSCapabilities } from 'ol/format';
//import WMSCapabilities from '../../../model/WMSCapabilities';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';

const versions = [
  { key: 'default', value: 'default', label: 'Especificada pela Serviço' },
  { key: '1.1.0', value: '1.1.0', label: '1.1.0' },
  { key: '1.1.1', value: '1.1.1', label: '1.1.1' },
  { key: '1.3.0', value: '1.3.0', label: '1.3.0' }
];

class WMS extends Component {

  constructor(props) {
    super(props);
    this.state = { showAdvanceOptions: false };
  }

  /**
   * Event handler for load WMS capabilities
   *
   * @param {Object} e The click handler
   */
  loadWMSCapabilities() {
    const { auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = this.props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    let srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    let bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    let options = {
      srid: srid,
      bbox: bbox,
      ignore_url: data.wmsIgnoreServiceUrl,
      version: data.wmsVersion,
      tiled: data.wmsTiled
    }
    let turl = data.url;
    turl = removeUrlParam(turl, 'request')
    turl = removeUrlParam(turl, 'service')
    turl = removeUrlParam(turl, 'version')
    turl = turl + (turl.indexOf('?') > -1 ? '' : '?')
    turl = turl + '&SERVICE=WMS&REQUEST=GetCapabilities';
    if (data.wmsVersion && data.wmsVersion !== 'default') {
      turl = turl + '&VERSION=' + data.wmsVersion;
    }

    //Add user authentication token
    if (isUrlAppHostname(turl) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        turl = turl + '&' + authkey + '=' + auth.data.auth_token;
      }
    }

    if (!isUrlAppOrigin(turl)) {
      turl = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(turl);
    }

    setLoading(true);
    fetch(turl)
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      try {
        const parser = new WMSCapabilities();
        const wms = parser.read(r);
        let dataitems = Models.OWSModel.convertWMS2Themes(wms, data.url, options);
        setData({ ...data, dataitems });

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wms', data.url);
        setLoading(false);

      } catch (e) {
        setLoading(false);
        setError(''+e);
      }
    }).catch((error) => {
      setData({ ...data, dataitems: [] });
      setLoading(false);
      setError(''+error);
    });
  }

  /**
   * On component did mount
   */
  componentDidMount() {
    const { data } = this.props;
    if (data.dataType === 'wms' && data.url) {
      this.loadWMSCapabilities();
    }
  }

  /**
   * Render WMS wizard
   */
  render() {
    const { loading, data, editField, getUrlHistory, winSize } = this.props;
    const { wmsIgnoreServiceUrl, wmsVersion, wmsTiled } = data;
    const { showAdvanceOptions } = this.state;
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
              this.loadWMSCapabilities()
            }}
          />
        </div>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>

        <Accordion activeIndex={showAdvanceOptions ? 0 : -1} className="p-pt-2">
          <AccordionTab header="Opções Avançadas">

            <div className="p-fluid">

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-7">Versão</label>
                <div className="p-col-12 p-md-5">
                  <Dropdown
                    options={versions}
                    value={wmsVersion}
                    onChange={(e) => editField('wmsVersion', e.value)}
                  />
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-7">Ignorar URL do serviço</label>
                <div className="p-col-12 p-md-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    id='Ignorar URL do serviço'
                    checked={wmsIgnoreServiceUrl}
                    onChange={e => editField('wmsIgnoreServiceUrl', !wmsIgnoreServiceUrl)}
                  />
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-7">Usar quadrículas</label>
                <div className="p-col-12 p-md-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    id='Usar quadrículas'
                    checked={wmsTiled}
                    onChange={e => editField('wmsTiled', !wmsTiled)}
                  />
                </div>
              </div>
            </div>

          </AccordionTab>
        </Accordion>

      </React.Fragment>
    )
  }
}

export default WMS;
