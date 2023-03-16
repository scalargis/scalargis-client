import React, {Component} from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';


class ArcGISMap extends Component {

  constructor(props) {
    super(props);
    this.state = { showAdvanceOptions: false };
  }

  /**
   * Event handler for load ArcGIS Map Srvice capabilities
   *
   * @param {Object} e The click handler
   */
  loadArcGISMapCapabilities() {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = this.props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    let srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    let bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    let options = {
      srid: srid,
      bbox: bbox,
      tiled: data.wmsTiled
    }
    let murl = `${data.url}?f=json`;
    let lurl = `${data.url}/layers?f=json`; 

    /*
    //Add user authentication token
    if (isUrlAppHostname(turl) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        turl = turl + '&' + authkey + '=' + auth.data.auth_token;
      }
    }
    */

    if (!isUrlAppOrigin(data.url)) {
      murl = core.MAP_PROXY_URL + encodeURIComponent(murl);
      lurl = core.MAP_PROXY_URL + encodeURIComponent(lurl);
    }

    setLoading(true);

    Promise.all([
      fetch(murl).catch((error) => error),
      fetch(lurl).catch((error) => error)
    ]).then(async(result) => {
      const capabilities = {
        service: null,
        layers: null
      }
      if (result[0].ok) capabilities['service'] = await result[0].json();
      if (result[1].ok) {
        const layers_data = await result[1].json();
        capabilities.layers = layers_data?.layers ? layers_data?.layers : null;
      }
      return capabilities;
    }).then((capabilities) => {
      let dataitems = Models.OWSModel.convertArcGISMap2Themes(capabilities, data.url, options);
      setData({ ...data, dataitems });        

      // Add to cookies history
      if (cookies) rememberUrl(cookies, 'arcgismap', data.url);
      setLoading(false);
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
    if (data.dataType === 'arcgismap' && data.url) {
      this.loadArcGISMapCapabilities();
    }
  }

  /**
   * Render WMS wizard
   */
  render() {
    const { loading, data, editField, getUrlHistory, winSize } = this.props;
    const { wmsTiled } = data;
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
              this.loadArcGISMapCapabilities()
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

export default ArcGISMap;