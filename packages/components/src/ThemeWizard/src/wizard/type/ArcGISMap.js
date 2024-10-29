import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function ArcGISMap(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'arcgismap' && props?.data?.url) {
      loadArcGISMapCapabilities();
    }
  }, [props?.data?.dataType]);


  /**
   * Event handler for load ArcGIS Map Service capabilities
   */
  const loadArcGISMapCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = props;
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
   * Render ArcGISMap wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory } = props;
    const { wmsTiled } = data;
    return (
      <React.Fragment>
        <div className="p-inputgroup">
          <InputText placeholder='https://...'
            value={data.url}
            list='urlhistory'
            onChange={e => editField('url', e.target.value.trim())}
          />
          <Button
            icon={ loading ? "pi pi-spin pi-spinner" : "pi pi-search" }
            tooltip={t("load", "Carregar")} tooltipOptions={{position: 'bottom'}}
            disabled={loading}
            onClick={e => {
              e.preventDefault();
              loadArcGISMapCapabilities();
            }}
          />
        </div>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>

        <Accordion activeIndex={data?.options?.showAdvancedOptions ? 0 : -1} className="pt-2"
          onTabChange={(e) => {
            const new_options = {
              ...data?.options,
              showAdvancedOptions: e.index === 0 ? true : false
            }
            editField("options", new_options);
          }}>
          <AccordionTab header={t("advancedOptions", "Opções Avançadas")}>
            <div className="p-fluid">
              <div className="field grid">
                <label className="col-12 md:col-7">{t("useTiles", "Usar quadrículas")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
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

  return render();

}