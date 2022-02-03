import React, {Component} from 'react';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';

const uploadEndpoint = process.env.REACT_APP_UPLOAD_URL 
  || "https://dgt.wkt.pt/spatial_toolbox/convert2geojson";
const API_URL = process.env.REACT_APP_API_URL 
  || 'http://localhost:5000';

class Shapefile extends Component {

  /**
   * Event handler for load Shapefile
   * 
   * @param {Object} e 
   */
  loadShapeFile(e) {
    const { mainMap, viewer, data, setLoading, setData, Models, fastFetch } = this.props;
    const { isUrlAppOrigin } = Models.Utils;    
    const endpoint = viewer.upload_url || uploadEndpoint;
    const name = e.files[0].name;

    const file = e.files[0];
    const upload = new FormData();
    upload.append('files', file);
    upload.append('ext', 'json');

    setLoading(true);
    const options = { method: 'POST', body: upload };
    fastFetch(endpoint, options, 8000)
      .then(res => res.json())
      .then(res => {

        // Validate response
        setLoading(false);
        if (!res.Success) {
          //console.log(res.Message);
          return setLoading(false);
        }

        let orginal_url = (API_URL || '') + res.Data.url;
        let url = orginal_url;
        if (!isUrlAppOrigin(url)) {
          url = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(url)
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
   * Render WMS wizard
   */
  render() {
    const { viewer, loading, data, editField } = this.props;
    return (
      <React.Fragment>
        <div className="p-fluid">

          <div className="p-field">
            <label>Sistema de Coordenadas</label>
            <Dropdown 
              placeholder='Escolha o sistema de coordenadas'
              options={viewer.config_json.crs_list.map(c => ({value: String(c.srid), label: c.title }))}
              value={data.crs || '4326'}
              onChange={(e) => editField('crs', e.value)}
            />
          </div>

          <div className="p-field">
            <label>Ficheiro ZIP contendo os ficheiros SHP, DBF e SHX</label>
            <FileUpload 
              name="upload"
              accept="application/zip"
              maxFileSize={this.props.maxFileSize * 1024}
              customUpload 
              uploadHandler={this.loadShapeFile.bind(this)}
              disabled={loading}
              url="./upload"
              chooseLabel="Escolher"
              uploadLabel="Carregar"
              cancelLabel="Cancelar"              
              invalidFileSizeMessageDetail=""
              invalidFileSizeMessageSummary={"O ficheiro não poderá ter mais de " + (Math.round((this.props.maxFileSize/1024) * 100) / 100) + " MB"}
            />
            { (this.props.maxFileSize && this.props.maxFileSize > 0) ?
            <small id="upload-help" className="p-warn">Dimensão máxima do ficheiro: {Math.round((this.props.maxFileSize/1024) * 100) / 100} MB</small>
            : null }            
          </div>
        </div>

      </React.Fragment>
    )
  }
}

export default Shapefile;