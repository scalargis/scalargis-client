import React from 'react';
import { withTranslation } from "react-i18next";
import { InputTextarea } from 'primereact/inputtextarea';
import { ColorPicker } from 'primereact/colorpicker';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';

import { i18n } from '@scalargis/components';

import COG from './type/COG';


class EditNode extends React.Component {

  constructor(props) {
    super(props);    
    this.state = {
      edit: props.edit,
      showAdvanceOptions: false
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
    let { edit } = this.state;
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

  render() {
    const { edit, showAdvanceOptions } = this.state;
    if (!edit) return null;

    const TypeComponent = this.typeComponent;

    let wmsServerTypeOtions = [
      { key: 999, value: '', label: this.props.t("notDefined", "Não Especificado") },
      { key: "geoserver", value: "geoserver", label: "Geoserver"},
      { key: "mapserver", value: "mapserver", label: "Mapserver"},
      { key: "qgis", value: "qgis", label: "QGIS"}
    ];
    let wmsFormatOptions = [];
    let wmsFeatureFormatOptions = [];
    let wmsStyleOptions = [{ key: 999, value: '', label: this.props.t("notDefined", "Não Especificado") }];

    let wmtsFormatOptions = [];
    let wmtsFeatureFormatOptions = [];
    let wmtsStyleOptions = [{ key: 999, value: '', label: this.props.t("notDefined", "Não Especificado") }]; 

    if (edit.type === 'WMS') {
      let map_formats = edit.get_map_formats || '';
      let finfo_formats = edit.get_feature_info_formats || '';
      let wstyles = edit.wms_styles || '';
      wmsFormatOptions = map_formats.split(',').map((i, j) => {
        return { key: j, value: i, label: i};
      });
      wmsFeatureFormatOptions = finfo_formats.split(',').map((i, j) => {
        return { key: j, value: i, label: i};
      });
      wstyles.split(',').forEach((i, j) => {
        wmsStyleOptions.push({ key: j, value: i, label: i})
        return i;
      });
    }

    if (['WMTS', 'WMTSXYZ'].includes(edit.type)) {
      let tile_formats = edit.wmts_formats || '';
      let wmts_finfo_formats = edit.get_feature_info_formats || '';
      let wstyles = edit.wmts_styles || '';
      wmtsFormatOptions = tile_formats.split(',')
      .filter(v => v && v.toLowerCase().indexOf('image/') !== -1)
      .map((i, j) => {
        return { key: j, value: i, label: i};
      });
      wmtsFeatureFormatOptions = wmts_finfo_formats.split(',').map((i, j) => {
        return { key: j, value: i, label: i};
      });        
      wstyles.split(',').forEach((i, j) => {
        wmtsStyleOptions.push({ key: j, value: i, label: i})
        return i;
      });      
    }

    return (
      <div>
        <div className="p-fluid">

          <div className="p-field p-grid">
            <label className="p-col-12 p-md-4">{this.props.t("title", "Título")}</label>
            <div className="p-col-12 p-md-8">
              <InputText
                value={i18n.translateValue(edit.title)}
                placeholder={this.props.t("title", "Título")}
                onChange={e => this.editField('title', e.target.value)}
                onClick={e => e.target.select()}
              />
            </div>
          </div>

          <div className="p-field p-grid">
            <label className="p-col-12 p-md-4">{this.props.t("description", "Descrição")}</label>
            <div className="p-col-12 p-md-8">
              <InputTextarea 
                value={edit.description} 
                placeholder={this.props.t("description", "Descrição")}
                style={{width: '100%', padding: '.67857143em 1em', border: '1px solid rgba(34,36,38,.15)'}}
                rows="5"
                onChange={e => this.editField('description', e.target.value)}
                onClick={e => e.target.select()}
              />
            </div>
          </div>

          { ['GeoJSON', 'KML', 'WMS', 'WFS', 'ArcGISMap'].includes(edit.type) ? (
            <div className="p-field p-grid">
              <label className="p-col-12 p-md-4">{this.props.t("selectElements", "Selecionar Elementos")}</label>
              <div className="p-col-12 p-md-8">
                <InputSwitch
                  checked={edit.selectable}
                  onChange={(e) => this.editField('selectable', !edit.selectable)}
                />
              </div>
            </div>
          ) : null }

        { (['WMTS', 'WMTSXYZ'].includes(edit.type) && edit.get_feature_info_formats) ? (
            <div className="p-field p-grid">
              <label className="p-col-12 p-md-4">{this.props.t("selectElements", "Selecionar Elementos")}</label>
              <div className="p-col-12 p-md-8">
                <InputSwitch
                  checked={edit.selectable}
                  onChange={(e) => this.editField('selectable', !edit.selectable)}
                />
              </div>
            </div>
          ) : null }          

          { edit.type === 'WMS' ? (
            <React.Fragment>
              <div>
                <p style={{textAlign: 'right'}}>
                  <a style={{cursor: 'pointer'}}
                    onClick={e => this.setState({...this.state, showAdvanceOptions: !showAdvanceOptions})}>
                    {this.props.t("advancedOptions", "Opções Avançadas")}{' '}
                    <i className={showAdvanceOptions ? 'pi pi-angle-up' : 'pi pi-angle-down'}></i>
                  </a>
                </p>
                { showAdvanceOptions && (
                <div className="p-pb-2">
                  <div className="p-pt-2">
                    <label>{this.props.t("serverType", "Tipo de Servidor")}</label>
                    <Dropdown placeholder={this.props.t("selectServerType", "Escolha o Tipo de Servidor")}
                      options={wmsServerTypeOtions}
                      value={edit.servertype || ''}
                      onChange={({ value }) => this.editField('servertype', value || undefined)}
                    />
                  </div>                  
                  <div className="p-pt-2">
                    <label>{this.props.t("getMapFormat", "Formato de GetMap")}</label>
                    <Dropdown placeholder={this.props.t("selectGetMapFormat", "Escolha o Formato de GetMap")}
                      options={wmsFormatOptions}
                      value={edit.get_map_format || ''}
                      onChange={({ value }) => this.editField('get_map_format', value)}
                    />
                  </div>
                  <div className="p-pt-2">
                    <label>{this.props.t("getFeatureInfoFormat", "Formato de GetFeatureInfo")}</label>
                    <Dropdown placeholder={this.props.t("selectGeFeatureInfoFormat", "Escolha o formato de GetFeatureInfo")}
                      options={wmsFeatureFormatOptions}
                      value={edit.get_feature_info_format || ''}
                      onChange={({ value }) => this.editField('get_feature_info_format', value)}
                    />
                  </div>
                  <div className="p-pt-2">
                    <label>{this.props.t("style", "Estilo")}</label>
                    <Dropdown placeholder={this.props.t("selectStyle", "Escolha o Estilo")}
                      options={wmsStyleOptions}
                      value={edit.wms_style || ''}
                      onChange={({ value }) => this.editField('wms_style', value)}
                    />
                  </div>
                </div>
                )}
              </div>
            </React.Fragment>
          ) : null }

          { ['WMTS', 'WMTSXYZ'].includes(edit.type) ? (
            <React.Fragment>
              <div>
                <p style={{textAlign: 'right'}}>
                  <a style={{cursor: 'pointer'}}
                    onClick={e => this.setState({...this.state, showAdvanceOptions: !showAdvanceOptions})}>
                    {this.props.t("advancedOptions", "Opções Avançadas")}{' '}
                    <i className={showAdvanceOptions ? 'pi pi-angle-up' : 'pi pi-angle-down'}></i>
                  </a>
                </p>
                { showAdvanceOptions && (
                <div className="p-pb-2">
                  <div className="p-pt-2">
                    <label>{this.props.t("getTileFormat", "Formato de GetTile")}</label>
                    <Dropdown placeholder={this.props.t("selectGetTileFormat", "Escolha o formato de GetTile")}
                      options={wmtsFormatOptions}
                      value={edit.wmts_format || ''}
                      onChange={({ value }) => this.editField('wmts_format', value)}
                    />
                  </div>
                  <div className="p-pt-2">
                    <label>{this.props.t("getFeatureInfoFormat", "Formato de GetFeatureInfo")}</label>
                    <Dropdown placeholder={this.props.t("selectGeFeatureInfoFormat", "Escolha o formato de GetFeatureInfo")}
                      options={wmtsFeatureFormatOptions}
                      value={edit.get_feature_info_format || ''}
                      onChange={({ value }) => this.editField('get_feature_info_format', value)}
                    />
                  </div>
                  <div className="p-pt-2">
                    <label>{this.props.t("style", "Estilo")}</label>
                    <Dropdown placeholder={this.props.t("selectStyle", "Escolha o Estilo")}
                      options={wmtsStyleOptions}
                      value={edit.wmts_style || ''}
                      onChange={({ value }) => this.editField('wmts_style', value)}
                    />
                  </div>
                </div>
                )}
              </div>
            </React.Fragment>
          ) : null }          

          { ['GeoJSON', 'WFS', 'KML'].includes(edit.type) ? (
            <React.Fragment>
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{this.props.t("fillColor", "Côr de Preenchimento")}</label>
                <div className="p-col-12 p-md-4">
                  <ColorPicker
                    format="rgb"
                    value={ edit.style_color ? this.convertToRGB(edit.style_color) : null }
                    onChange={({value}) => this.editField('style_color', this.convertToRGBString(value)) }
                  />
                </div>
                <div className="p-col-12 p-md-4">
                  <InputText
                    placeholder={this.props.t("fillColor", "Côr de Preenchimento")}
                    value={edit.style_color ? this.convertToRGBAString(edit.style_color) : null }
                  />
                </div>
              </div>
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{this.props.t("outlineColor", "Côr de Rebordo")}</label>
                <div className="p-col-12 p-md-4">
                  <ColorPicker
                    format="rgb"
                    value={ edit.style_stroke_color ? this.convertToRGB(edit.style_stroke_color) : null }
                    onChange={({value}) => this.editField('style_stroke_color', this.convertToRGBString(value)) }
                  />
                </div>
                <div className="p-col-12 p-md-4">
                  <InputText
                    placeholder={this.props.t("outlineColor", "Côr de Rebordo")}
                    value={ edit.style_stroke_color ? this.convertToRGBAString(edit.style_stroke_color) : null }
                  />
                </div>
              </div>
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{this.props.t("outlineWidth", "Espessura de Rebordo")}</label>
                <div className="p-col-12 p-md-8">
                  <InputText
                    type="number"
                    min="0"
                    value={edit.style_stroke_width}
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

        <div className="p-dialog-myfooter">
          <Button 
            color='green'
            icon="pi pi-check"
            label={this.props.t("apply", "Aplicar")} 
            onClick={e => this.props.onSave(e, edit)}
          />
        </div>

      </div>
    );
  }

}

export default withTranslation()(EditNode);