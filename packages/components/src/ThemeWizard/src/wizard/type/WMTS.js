import React, {Component} from 'react';
import { WMTSCapabilities } from 'ol/format';
//import WMSCapabilities from '../../../model/WMSCapabilities';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';

const versions = [
  { key: 'default', value: 'default', label: 'Especificada pelo Serviço' },
  { key: '1.0.0', value: '1.0.0', label: '1.0.0' }
];

class WMTS extends Component {

  constructor(props) {
    super(props);
    this.state = { showAdvanceOptions: false };
  }

  /**
   * Event handler for load WMTS capabilities
   *
   * @param {Object} e The click handler
   */
  loadWMTSCapabilities() {
    const { auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = this.props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    let srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    let bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    let options = {
      srid: srid,
      bbox: bbox,
      ignore_url: data.wmtsIgnoreServiceUrl,
      version: data.wmtsVersion
    }
    let turl = data.url;
    turl = removeUrlParam(turl, 'request')
    turl = removeUrlParam(turl, 'service')
    turl = removeUrlParam(turl, 'version')
    turl = turl + (turl.indexOf('?') > -1 ? '' : '?')
    turl = turl + '&SERVICE=WMTS&REQUEST=GetCapabilities';
    if (data.wmtsVersion && data.wmtsVersion !== 'default') {
      turl = turl + '&VERSION=' + data.wmtsVersion;
    }

    //Add user authentication token
    if (isUrlAppHostname(turl) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        turl = turl + '&' + authkey + '=' + auth.data.auth_token;
      }
    }

    if (!isUrlAppOrigin(turl)) {
      turl = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(turl)
    };

    setLoading(true);
    fetch(turl)
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      try {
        const parser = new WMTSCapabilities();
        const wmts = parser.read(r);
        data.dataitems = Models.OWSModel.convertWMTS2Themes(wmts, data.url, options);
        data.wmtsTileMatrixSet = [];
        if (wmts.Contents && wmts.Contents.TileMatrixSet) {
          data.wmtsTileMatrixSet = wmts.Contents.TileMatrixSet.map(m => ({ Identifier: m.Identifier, SupportedCRS: m.SupportedCRS }));
        }
        setData(data);

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wmts', data.url);
        setLoading(false);

      } catch (e) {
        setError(''+e);
        setLoading(false);
      }
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
    if (data.dataType === 'wmts' && data.url) {
      this.loadWMTSCapabilities();
    }
  }

  /**
   * Render WMTS wizard
   */
  render() {
    const { loading, data, editField, getUrlHistory, winSize } = this.props;
    const { wmtsIgnoreServiceUrl, wmtsVersion } = data;
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
              this.loadWMTSCapabilities()
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
                    value={wmtsVersion}
                    onChange={(e, { value }) => editField('wmtsVersion', value)}
                  />
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-7">Ignorar URL do serviço</label>
                <div className="p-col-12 p-md-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    id='Ignorar URL do serviço'
                    checked={wmtsIgnoreServiceUrl}
                    onChange={e => editField('wmtsIgnoreServiceUrl', !wmtsIgnoreServiceUrl)}
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

export default WMTS;
