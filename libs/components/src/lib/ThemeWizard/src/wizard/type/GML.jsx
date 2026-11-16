import React from 'react';
import { useTranslation } from "react-i18next";
import { Select } from '@mantine/core';
import { FileUpload, notify } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../../i18n/index';
import { uploadVectorFile } from '../upload';


export default function GML(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const loadGMLFile = (e) => uploadVectorFile(props, t, e.files[0], 'xml', t("errorProcessingGMLFile", "Ocorreu um erro ao processar o ficheiro GML."));

  /**
   * Render WMS wizard
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
            <label>{t("file", "Ficheiro")} GML</label>
            <FileUpload
              multiple={false}
              accept={{ 'application/gml+xml': ['.gml'] }}
              maxSize={props.maxFileSize * 1024}
              disabled={loading}
              chooseLabel={t("choose", "Escolher")}
              uploadLabel={t("load", "Carregar")}
              cancelLabel={t("cancel", "Cancelar")}
              onUpload={(files) => loadGMLFile({ files })}
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