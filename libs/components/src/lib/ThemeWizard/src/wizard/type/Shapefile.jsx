import React from 'react';
import { useTranslation } from "react-i18next";
import { Select } from '@mantine/core';
import { FileUpload, notify } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function ArcGISMap(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  /**
   * Event handler for load Shapefile
   * 
   * @param {Object} e 
   */
  const loadShapeFile = (e) => {

    console.log(e);

    const { core, mainMap, viewer, data, setLoading, setData, Models, fastFetch } = props;
    const { isUrlAppOrigin } = Models.Utils;    
    const endpoint = viewer.upload_url || core.UPLOAD_URL;
    const name = e.files[0].name;

    const file = e.files[0];
    const upload = new FormData();
    upload.append('files', file);
    upload.append('ext', 'json');

    setLoading(true);
    const options = { method: 'POST', body: upload };
    fastFetch(endpoint, options, 8000)
      .then(res => {return res.json()})
      .then(res => {

        // Validate response
        setLoading(false);
        if (!res.Success) {
          //console.log(res.Message);
          return setLoading(false);
        }

        const orginal_url = core.API_URL + res.Data.url;
        let url = orginal_url;
        if (!isUrlAppOrigin(url)) {
          url = core.MAP_PROXY_URL + encodeURIComponent(url);
        };      
        fetch(url)
          .then(res => res.json())
          .then(res => {
            data.dataitems = Models.OWSModel.convertGeoJSON2Themes(res, orginal_url, name, data.crs);
            setData(Object.assign({}, data));
            setLoading(false);
        })

          // Catch download error
          .catch(error => {
            console.error(error);
            setLoading(false);
          });
      })
  
      // Catch upload error
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }

  /**
   * Render Shapefile wizard
   */
  const render = () => {
    const { viewer, loading, data, editField } = props;
    return (
      <div className="p-fluid">

          <div className="field">
            <label>{t("coordinateSystem", "Sistema de Coordenadas")}</label>
            <Select
              placeholder={t("selectCoordinateSystem", "Escolha o sistema de coordenadas")}
              data={viewer.config_json.crs_list.map(c => ({value: String(c.srid), label: c.title }))}
              value={String(data.crs || '4326')}
              onChange={(value) => editField('crs', value)}
            />
          </div>

          <div className="field">
            <label>{t("shapefileFormatInfo", "Ficheiro ZIP contendo os ficheiros SHP, DBF e SHX")}</label>
            <FileUpload
              multiple={false}
              accept={{ 'application/zip': ['.zip'], 'application/x-zip-compressed': ['.zip'] }}
              maxSize={props.maxFileSize * 1024}
              disabled={loading}
              chooseLabel={t("choose", "Escolher")}
              uploadLabel={t("load", "Carregar")}
              cancelLabel={t("cancel", "Cancelar")}
              onUpload={async (files) => loadShapeFile({ files })}
              onReject={(rejections) => {
                const msg = t("maxFileSizeError", "O ficheiro não pode ter mais de {{size}} MB", {size: (Math.round((props.maxFileSize/1024) * 100) / 100)});
                rejections.forEach(r => notify.error(r.file.name, msg));
              }}
            />
            { (props.maxFileSize && props.maxFileSize > 0) ?
            <small id="upload-help" className="p-warn">{t("maxFileSizeInfo", "Dimensão máxima do ficheiro: {{size}} MB",  {size: (Math.round((props.maxFileSize/1024) * 100) / 100)})}</small>
            : null }
          </div>
        </div>
    )
  }

  return render();
}
