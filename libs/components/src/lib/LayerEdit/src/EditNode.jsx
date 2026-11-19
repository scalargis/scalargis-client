import React from 'react';
import { withTranslation } from "react-i18next";
import { Accordion, Button, ColorInput, Group, Select, Switch, Textarea, TextInput } from '@mantine/core';
import { IconCheck } from '@scalargis/ui';

import { i18n } from '../../components';

import COG from './type/COG';

/** Splits a comma-separated list, without empty or repeated items. */
function splitList(value) {
  return [...new Set(String(value || '').split(',').map(v => v.trim()).filter(Boolean))];
}

/** Maps a list of values to Select options. */
function toOptions(values) {
  return [...new Set(values)].map((v, j) => ({ key: j, value: v, label: v }));
}

/** Returns the style identifiers of a WMTS layer from its capabilities, or null. */
function wmtsCapabilityStyles(edit) {
  const layers = edit?.wmts_capabilities?.Contents?.Layer;
  if (!Array.isArray(layers)) return null;
  const layer = layers.find(l => l.Identifier === edit.layer);
  if (!layer || !Array.isArray(layer.Style)) return null;
  const ids = layer.Style.map(s => s.Identifier).filter(Boolean);
  return ids.length ? ids : null;
}

class EditNode extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      edit: props.edit
    };
    //Default value of 'selectable' property is true
    if (props.edit.selectable == null) {
      this.editField('selectable', true );
    }

    switch(props?.edit?.type) {
      case 'COG': this.typeComponent = COG; break;
      default: this.typeComponent = null;
    }

  }

  editField(field, value) {
    const { edit } = this.state;
    edit[field] = value;
    this.setState({ ...this.state, edit });
  }

  convertToRGBAString(str) {
    const fill = str.split(',');
    return `rgba(${ fill[0] }, ${ fill[1] }, ${ fill[2] }, ${ fill[3] })`;
  }

  convertToRGBA(str) {
    const fill = str.split(',');
    return { r: fill[0], g: fill[1], b: fill[2], a: fill[3] };
  }

  convertToRGB(str) {
    const fill = str.split(',');
    return { r: fill[0], g: fill[1], b: fill[2] };
  }

  convertToRGBString(rgb) {
    return [rgb.r, rgb.g, rgb.b, 1].join(',');
  }

  // "rgba(r, g, b, a)" -> "r,g,b,a" (the stored comma-joined format)
  convertFromRGBAString(str) {
    const parts = String(str).match(/[\d.]+/g) || [];
    return parts.slice(0, 4).join(',');
  }

  render() {
    const { edit } = this.state;
    if (!edit) return null;

    const TypeComponent = this.typeComponent;

    const wmsServerTypeOtions = [
      { key: 999, value: '', label: this.props.t("notDefined", "Não Especificado") },
      { key: "geoserver", value: "geoserver", label: "Geoserver"},
      { key: "mapserver", value: "mapserver", label: "Mapserver"},
      { key: "qgis", value: "qgis", label: "QGIS"}
    ];
    let wmsFormatOptions = [];
    let wmsFeatureFormatOptions = [];
    const wmsStyleOptions = [{ key: 999, value: '', label: this.props.t("notDefined", "Não Especificado") }];

    let wmtsFormatOptions = [];
    let wmtsFeatureFormatOptions = [];
    const wmtsStyleOptions = [{ key: 999, value: '', label: this.props.t("notDefined", "Não Especificado") }];

    if (edit.type === 'WMS') {
      wmsFormatOptions = toOptions(splitList(edit.get_map_formats));
      wmsFeatureFormatOptions = toOptions(splitList(edit.get_feature_info_formats));
      wmsStyleOptions.push(...toOptions(splitList(edit.wms_styles)));
    }

    if (['WMTS', 'WMTSXYZ'].includes(edit.type)) {
      wmtsFormatOptions = toOptions(splitList(edit.wmts_formats)
        .filter(v => v.toLowerCase().indexOf('image/') !== -1));
      wmtsFeatureFormatOptions = toOptions(splitList(edit.get_feature_info_formats));
      const capStyles = wmtsCapabilityStyles(edit);
      wmtsStyleOptions.push(...toOptions(capStyles || splitList(edit.wmts_styles)));
    }

    return (
      <div>
        <div className="p-fluid">

          <div className="field grid">
            <label className="col-12 md:col-4">{this.props.t("title", "Título")}</label>
            <div className="col-12 md:col-8">
              <TextInput
                value={i18n.translateValue(edit.title)}
                placeholder={this.props.t("title", "Título")}
                onChange={e => this.editField('title', e.target.value)}
                onClick={e => e.target.select()}
              />
            </div>
          </div>

          <div className="field grid">
            <label className="col-12 md:col-4">{this.props.t("description", "Descrição")}</label>
            <div className="col-12 md:col-8">
              <Textarea
                value={edit.description || ''}
                placeholder={this.props.t("description", "Descrição")}
                rows={5}
                onChange={e => this.editField('description', e.target.value)}
                onClick={e => e.target.select()}
              />
            </div>
          </div>

          { ['GeoJSON', 'KML', 'WMS', 'WFS', 'ArcGISMap'].includes(edit.type) ? (
            <div className="field grid">
              <label className="col-12 md:col-4">{this.props.t("selectElements", "Selecionar Elementos")}</label>
              <div className="col-12 md:col-8">
                <Switch
                  size="md"
                  checked={!!edit.selectable}
                  onChange={(e) => this.editField('selectable', !edit.selectable)}
                />
              </div>
            </div>
          ) : null }

        { (['WMTS', 'WMTSXYZ'].includes(edit.type) && edit.get_feature_info_formats) ? (
            <div className="field grid">
              <label className="col-12 md:col-4">{this.props.t("selectElements", "Selecionar Elementos")}</label>
              <div className="col-12 md:col-8">
                <Switch
                  size="md"
                  checked={!!edit.selectable}
                  onChange={(e) => this.editField('selectable', !edit.selectable)}
                />
              </div>
            </div>
          ) : null }

          { edit.type === 'WMS' ? (
            <Accordion className="pt-2">
              <Accordion.Item value="advanced">
                <Accordion.Control>{this.props.t("advancedOptions", "Opções Avançadas")}</Accordion.Control>
                <Accordion.Panel>
                <div className="pb-2">
                  <div className="pt-2">
                    <label>{this.props.t("serverType", "Tipo de Servidor")}</label>
                    <Select placeholder={this.props.t("selectServerType", "Escolha o Tipo de Servidor")}
                      data={wmsServerTypeOtions}
                      value={edit.servertype || ''}
                      onChange={(value) => this.editField('servertype', value || undefined)}
                    />
                  </div>
                  <div className="pt-2">
                    <label>{this.props.t("getMapFormat", "Formato de GetMap")}</label>
                    <Select placeholder={this.props.t("selectGetMapFormat", "Escolha o Formato de GetMap")}
                      data={wmsFormatOptions}
                      value={edit.get_map_format || ''}
                      onChange={(value) => this.editField('get_map_format', value)}
                    />
                  </div>
                  <div className="pt-2">
                    <label>{this.props.t("getFeatureInfoFormat", "Formato de GetFeatureInfo")}</label>
                    <Select placeholder={this.props.t("selectGeFeatureInfoFormat", "Escolha o formato de GetFeatureInfo")}
                      data={wmsFeatureFormatOptions}
                      value={edit.get_feature_info_format || ''}
                      onChange={(value) => this.editField('get_feature_info_format', value)}
                    />
                  </div>
                  <div className="pt-2">
                    <label>{this.props.t("style", "Estilo")}</label>
                    <Select placeholder={this.props.t("selectStyle", "Escolha o Estilo")}
                      data={wmsStyleOptions}
                      value={edit.wms_style || ''}
                      onChange={(value) => this.editField('wms_style', value)}
                    />
                  </div>
                </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          ) : null }

          { ['WMTS', 'WMTSXYZ'].includes(edit.type) ? (
            <Accordion className="pt-2">
              <Accordion.Item value="advanced">
                <Accordion.Control>{this.props.t("advancedOptions", "Opções Avançadas")}</Accordion.Control>
                <Accordion.Panel>
                <div className="pb-2">
                  <div className="pt-2">
                    <label>{this.props.t("getTileFormat", "Formato de GetTile")}</label>
                    <Select placeholder={this.props.t("selectGetTileFormat", "Escolha o formato de GetTile")}
                      data={wmtsFormatOptions}
                      value={edit.wmts_format || ''}
                      onChange={(value) => this.editField('wmts_format', value)}
                    />
                  </div>
                  <div className="pt-2">
                    <label>{this.props.t("getFeatureInfoFormat", "Formato de GetFeatureInfo")}</label>
                    <Select placeholder={this.props.t("selectGeFeatureInfoFormat", "Escolha o formato de GetFeatureInfo")}
                      data={wmtsFeatureFormatOptions}
                      value={edit.get_feature_info_format || ''}
                      onChange={(value) => this.editField('get_feature_info_format', value)}
                    />
                  </div>
                  <div className="pt-2">
                    <label>{this.props.t("style", "Estilo")}</label>
                    <Select placeholder={this.props.t("selectStyle", "Escolha o Estilo")}
                      data={wmtsStyleOptions}
                      value={edit.wmts_style || ''}
                      onChange={(value) => this.editField('wmts_style', value)}
                    />
                  </div>
                </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          ) : null }

          { ['GeoJSON', 'WFS', 'KML'].includes(edit.type) ? (
            <React.Fragment>
              <div className="field grid">
                <label className="col-12 md:col-4">{this.props.t("fillColor", "Côr de Preenchimento")}</label>
                <div className="col-12 md:col-8">
                  <ColorInput
                    format="rgba"
                    value={ edit.style_color ? this.convertToRGBAString(edit.style_color) : '' }
                    onChange={(value) => {
                      const rgba = this.convertFromRGBAString(value);
                      if (rgba.split(',').length === 4) this.editField('style_color', rgba);
                    }}
                  />
                </div>
              </div>
              <div className="field grid">
                <label className="col-12 md:col-4">{this.props.t("outlineColor", "Côr de Rebordo")}</label>
                <div className="col-12 md:col-8">
                  <ColorInput
                    format="rgba"
                    value={ edit.style_stroke_color ? this.convertToRGBAString(edit.style_stroke_color) : '' }
                    onChange={(value) => {
                      const rgba = this.convertFromRGBAString(value);
                      if (rgba.split(',').length === 4) this.editField('style_stroke_color', rgba);
                    }}
                  />
                </div>
              </div>
              <div className="field grid">
                <label className="col-12 md:col-4">{this.props.t("outlineWidth", "Espessura de Rebordo")}</label>
                <div className="col-12 md:col-8">
                  <TextInput
                    type="number"
                    min="0"
                    value={edit.style_stroke_width || ''}
                    placeholder={this.props.t("outlineWidth", "Espessura de Rebordo")}
                    onChange={e => this.editField('style_stroke_width', e.target.value)}
                  />
                </div>
              </div>
            </React.Fragment>

          ) : null }

          { ['COG'].includes(edit.type) ? (
              <TypeComponent
                data={edit}
                editField={(field, value) => this.editField(field, value)}
              />
          ) : null }

        </div>

        <Group justify="flex-end" mt="md">
          <Button
            type="button"
            leftSection={<IconCheck />}
            onClick={e => this.props.onSave(e, edit)}
          >
            {this.props.t("apply", "Aplicar")}
          </Button>
        </Group>

      </div>
    );
  }

}

export default withTranslation()(EditNode);
