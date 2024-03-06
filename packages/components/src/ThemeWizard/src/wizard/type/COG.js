import React, {useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";

import * as GeoTIFFLib from "geotiff";

import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import {InputSwitch} from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';


export default function COG(props) {

  const { core, auth, mainMap, viewer, data, loading, setLoading, setData, setError, editField, cookies, Models } = props;
  const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
  const { hasProjection, addProjections } = Models.MapModel;
  const { getCOGImageProjCode } = Models.OWSModel;

  const { t } = useTranslation(); 

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);


  const bandOptions = useMemo(() => {
    if (!data?.options?.image_bands) {
      return [1, 2, 3];
    }
    return Array.from({length: data.options.image_bands}, (_, index) => (index + 1));
  }, [data?.options?.image_bands]);

  /**
   * Event handler for load COG
   *
   * @param {Object} e The click handler
   */
  const loadCOGMetadata = () => {

    if (!data.url) return;

    let url = data.url;

    //Add user authentication token
    if (isUrlAppHostname(url) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        url = url + '&' + authkey + '=' + auth.data.auth_token;
      }
    }

    /*
    if (!isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    }
    */

    setLoading(true);

    GeoTIFFLib.fromUrl(url)
    .then(tiff => {
      return tiff.getImage(); 
    }).then(async image => {
      const code = getCOGImageProjCode(image);
      const epsg = `EPSG:${code}`;

      if (!hasProjection(epsg)) {
        //throw new Error(`Unsupported coordinate reference system (EPSG:${code})`);
        try {
          const response = await fetch(`https://epsg.io/${code}.proj4`);
          const projText = await response.text();

          const newProj = {
            "srid": code,
            "code": epsg,
            "title": image?.geoKeys?.GTCitationGeoKey || epsg,
            "defs": projText,
            "extent": "-180 -90 180 90",
            "description": image?.geoKeys?.GTCitationGeoKey || `Dinamically loaded by COG image (${epsg})`
          }
          addProjections([newProj]);
        } catch (error) {
          throw new Error(`Could not load unsupported coordinate reference system (EPSG:${code})`);
        }
      }
      return image;
    }).then(image => {
      const number_bands = image.getSamplesPerPixel();
      const available_bands = Array.from({length: number_bands}, (_, index) => (index + 1));
      const options = {
        image_bands: number_bands,
        bands: number_bands >= 3 ? [1, 2, 3] : available_bands
      }

      // Extract filename from url path
      const baseUrl = url.indexOf('?') === -1 ? url : url.slice(0, url.indexOf('?'));
      const [...parts] = baseUrl.split('/');
      const filename = parts.pop();

      let dataitems = Models.OWSModel.convertCOG2Themes(image, data.url, filename, options);
      setData({ ...data, options, dataitems });
    }).catch((error) => {
      setData({ ...data, dataitems: [] });
      setLoading(false);
      setError('' + error);
    }).finally(()=>{
      setLoading(false);
    });
  }

  const onChangeBand = (index, value) => {
    const bands = [...selectedBands];
    bands[index] = value;

    const new_options = {
      ...data?.options,
      bands: bands
    }
    editField("options", new_options);

    if (data?.dataitems?.length) {
      let item = data.dataitems[0];
      item = {
        ...item,
        options: {
          ...item.options,
          bands: bands
        }
      }

      setData({
        ...data,
        dataitems: [item]
      });
    }
  }

  const onChangeConvertToRGB = (value) => {
    const new_options = {
      ...data?.options,
      convertToRGB: value
    }
    editField("options", new_options);

    if (data?.dataitems?.length) {
      let item = data.dataitems[0];
      item = {
        ...item,
        options: {
          ...item.options,
          convertToRGB: value
        }
      }
      setData({
        ...data,
        dataitems: [item]
      });
    }
  }

  const onChangeNoData = (value) => {
    const new_options = {
      ...data?.options,
      nodata: value
    }
    editField("options", new_options);

    if (data?.dataitems?.length) {
      let item = data.dataitems[0];
      item = {
        ...item,
        options: {
          ...item.options,
          nodata: value
        }
      }
      setData({
        ...data,
        dataitems: [item]
      });
    }
  }

  let selectedBands = [1, 2, 3];
  let convertToRGB;
  let nodata;
  if (data?.dataitems?.length) {
    if (data?.dataitems[0].options?.bands?.length) {
      selectedBands = data.dataitems[0].options.bands;
    } else if (data?.options?.bands?.length) {
      selectedBands = data.options.bands;
    }
    convertToRGB = data.dataitems[0]?.options?.convertToRGB != null ? data.dataitems[0].options.convertToRGB : false;
    nodata = data.dataitems[0]?.options?.nodata != null ? data.dataitems[0].options?.nodata : undefined;
  }


  /**
   * Render COG wizard
   */
  const render = () => {

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
            tooltip="Carregar" tooltipOptions={{position: 'bottom'}}
            disabled={loading}
            onClick={e => {
              e.preventDefault();
              loadCOGMetadata()
            }}
          />
        </div>
        {/*
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>
          */}

        <Accordion activeIndex={showAdvancedOptions ? 0 : -1} className="p-pt-2">
          <AccordionTab header="Opções Avançadas">

            <div className="p-fluid">
              <div className="p-field p-grid">
                <Fieldset legend={t("bands", `Bandas` )} className="p-col-12">
                  <div className="p-field p-grid">
                    <label className="p-col-12 p-md-4">{t("red", "Vermelho")}</label>
                    <div className="p-col-12 p-md-8">
                      <Dropdown placeholder={t("selectBands", "Selecione a banda")}
                        options={bandOptions}
                        value={selectedBands[0]}
                        onChange={({ value }) => {
                          onChangeBand(0, value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-field p-grid">
                    <label className="p-col-12 p-md-4">{t("green", "Verde")}</label>
                    <div className="p-col-12 p-md-8">
                      <Dropdown placeholder={t("selectBands", "Selecione a banda")}
                        options={bandOptions}
                        value={selectedBands[1]}
                        onChange={({ value }) => {
                          onChangeBand(1, value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-field p-grid">
                    <label className="p-col-12 p-md-4">{t("azul", "Azul")}</label>
                    <div className="p-col-12 p-md-8">
                      <Dropdown placeholder={t("selectBands", "Selecione a banda")}
                        options={bandOptions}
                        value={selectedBands[2]}
                        onChange={({ value }) => {
                          onChangeBand(2, value);
                        }}
                      />
                    </div>
                  </div>
                </Fieldset>
              </div>
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-6">{t("convertToRGB", "Converter para RGB")}</label>
                <InputSwitch checked={convertToRGB} onChange={(e) => {
                  onChangeConvertToRGB(e.value);
                }} />
              </div> 

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("nodataValue", "Valor NoData")}</label>
                <div className="p-col-12 p-md-8">
                  <InputNumber value={nodata} mode="decimal" onValueChange={(e) => {
                    onChangeNoData(e.value);
                  }} />
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