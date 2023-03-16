import React, {Component} from 'react';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import {parseString} from 'xml2js';


class KML extends Component {

  constructor(props) {
    super(props);

    const { editField } = props;

    editField('crs', 4326);
  }  

  loadKMLData(file, name) {
    const { core, mainMap, viewer, data, setLoading, setData, setError, Models, fastFetch } = this.props;
    const { isUrlAppOrigin } = Models.Utils;
    const endpoint = viewer.upload_url || core.UPLOAD_URL;
    
    const upload = new FormData();
    upload.append('files', file);
    upload.append('ext', 'kml');

    setLoading(true);
    const options = { method: 'POST', body: upload };
    fastFetch(endpoint, options, 8000)
      .then(res => res.json())
      .then(res => {

        // Validate response
        if (!res.Success) {
          setError('Ocorreu um erro ao processar o ficheiro KML!');
          return setLoading(false);
        }
        
        let orginal_url = core.API_URL + res.Data.url;
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
          setLoading(false);
          setError(''+error);
        });
      })
      
      // Catch upload error
      .catch(error => {
        setLoading(false);
        setError(''+error);
      });
  }

  /**
   * Event handler for load file
   * 
   * @param {Object} e 
   */
  loadKMLFile(e) {
    const name = e.files[0].name;
    const file = e.files[0];
    this.loadKMLData(file, name);
  }

  changeURL(value) {
    let { data, setData } = this.props;
    data.url = value.trim();
    setData(Object.assign({}, data));
  }

  loadFromUserURL() {
    let { core, data, setData, setSelected, setError, cookies, setLoading, Models, } = this.props;
    let { isUrlAppOrigin } = Models.Utils;
    let name = 'KML';
    let url = data.url || '';

    if (!url.trim()) return;

    if (!isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    };
    setLoading(true);

    fetch(url)
      .then(res => res.text())
      .then(res => {
        try {
          parseString(res, function (err, kml) { 
            data.dataitems = Models.OWSModel.convertKML2Themes(kml, data.url, res, data.crs);
            if (data.dataitems && data.dataitems.length > 0) {
              setLoading(false);
              setData(Object.assign({}, data));
              // Add to cookies history
              //if (cookies) rememberUrl(cookies, 'geojson', data.url);              
            } else {
              throw Error('Não foi possível obter uma resposta válida.');
            }
          });
        } catch (e) {
          setLoading(false);
          setError(''+e);
        }          
      })
      .catch(error => {
        setData({ ...data, dataitems: [] });
        setSelected({});
        setLoading(false);
        setError(''+error);
      })

    /*   
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Não foi possível obter uma resposta válida.');
        } else {
          return res.text();
        }
      })
      .then(res => {
        try {
          const file = new File([res], name, {type: "application/vnd.google-earth.kml+xml", lastModified: new Date() });
          this.loadKMLData(file, name);

          // Add to cookies history
          //if (cookies) rememberUrl(cookies, 'geojson', data.url);
          //setLoading(false);
        } catch (e) {
          setLoading(false);
          setError(''+e);
        }        
      })
      // Catch download error
      .catch(error => {
        setData({ ...data, dataitems: [] });
        setSelected({});
        setLoading(false);
        setError(''+error);
      });
      */
  }

  /**
   * Render KML wizard
   */
  render() {
    const { viewer, loading, data, editField, winSize } = this.props;
    return (
      <React.Fragment>
        <div className="p-fluid">

          <TabView>
            <TabPanel header="Ficheiro">
              <div className="p-field">
                <label>Ficheiro - KML/KMZ</label>
                <FileUpload 
                  name="upload"
                  accept=".kml,.kmz"
                  maxFileSize={this.props.maxFileSize * 1024}
                  customUpload 
                  uploadHandler={this.loadKMLFile.bind(this)}
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
            </TabPanel>
            <TabPanel header="URL">
              <div className="p-field">
                <label>URL - KML</label>
                <div className="p-inputgroup">
                  <InputText placeholder='URL...'
                    value={data.url}
                    onChange={e => this.changeURL(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <Button
                    icon={ loading ? "pi pi-spin pi-spinner" : "pi pi-search" }
                    tooltip="Carregar" tooltipOptions={{position: 'bottom'}}
                    disabled={loading}
                    onClick={e => {
                      e.preventDefault();
                      this.loadFromUserURL()
                    }}
                  />
                </div>
                
              </div>
            </TabPanel>

          </TabView>

        </div>

      </React.Fragment>
    )
  }
}

export default KML;