import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { SelectButton } from 'primereact/selectbutton';
import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import * as OlSphere from 'ol/sphere';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import OlDraw from 'ol/interaction/Draw';
import OlStyle from 'ol/style/Style';
import OlCircle from 'ol/style/Circle';
import OlFill from 'ol/style/Fill';
import OlStroke from 'ol/style/Stroke';
import { unit } from 'mathjs';
import './style.css';

// TODO: create namespace in Store and pass actions through props

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      helpModal: false,
      helpLengthShowed: false,
      helpAreaShowed: false,
      control: props.selected_control || '',
      length: 0,
      area: 0
    };

    // Drawing style
    this.drawingsStyle = new OlStyle({
      fill: new OlFill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new OlStroke({
        color: '#ffcc33',
        width: 2
      })
    });

    // Draw style
    this.drawStyle = new OlStyle({
      fill: new OlFill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new OlStroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new OlCircle({
        radius: 5,
        stroke: new OlStroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new OlFill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    });

    /**
     * Currently drawn feature.
     * @type {module:ol/Feature~Feature}
     */
    this.sketch = null;

    /**
     * The help tooltip element.
     * @type {Element}
     */
    this.helpTooltipElement = null;


    /**
     * Overlay to show the help messages.
     * @type {module:ol/Overlay}
     */
    this.helpTooltip = null;


    /**
     * The measure tooltip element.
     * @type {Element}
     */
    this.measureTooltipElement = null;


    /**
     * Overlay to show the measurement.
     * @type {module:ol/Overlay}
     */
    this.measureTooltip = null;


    /**
     * Message to show when the user is drawing a polygon.
     * @type {string}
     */
    const continuePolygonMsg = 'Clique para continuar a desenhar o polígono';


    /**
     * Message to show when the user is drawing a line.
     * @type {string}
     */
    const continueLineMsg = 'Clique para continuar a desenhar a linha';


    /**
     * Handle pointer move.
     * @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt The event.
     */
    this.pointerMoveHandler = (evt) => {
        if (evt.dragging) {
            return;
        }
        /** @type {string} */
        let helpMsg = 'Clique para começar a desenhar';

        if (this.sketch) {
            const geom = (this.sketch.getGeometry());
            if (geom instanceof Polygon) {
            helpMsg = continuePolygonMsg;
            } else if (geom instanceof LineString) {
            helpMsg = continueLineMsg;
            }
        }

        this.helpTooltipElement.innerHTML = helpMsg;
        this.helpTooltip.setPosition(evt.coordinate);

        this.helpTooltipElement.classList.remove('hidden');
    };

    this.onMouseOutViewport = () => {
      this.helpTooltipElement.classList.add('hidden');
    }

    /**
     * Format length output.
     * @param {module:ol/geom/LineString~LineString} line The line.
     * @return {string} The formatted length.
     */
    this.formatLength = function(line) {
      let length = OlSphere.getLength(line, {projection: this.props.mainMap.getView().getProjection().getCode()});
      if (this.props.record.config_json && this.props.record.config_json.crs) {
        if (this.props.viewer.config_json.crs_list) {
          const prj = this.props.viewer.config_json.crs_list.find(x => x.srid === this.props.record.config_json.crs);
          if (prj) {
            const geom = line.clone().transform(this.props.mainMap.getView().getProjection().getCode(), prj.code);
            length = geom.getLength();
          }
        }
      }

      let output = length;
      if (this.props.record?.config_json?.length?.format) {
        const format = this.props.record.config_json.length.format;

        if (format.source_unit && format.output_unit) {
          output = unit(length, format.source_unit).toNumeric(format.output_unit);
        }
        if (format.options) {
          output = output.toLocaleString(format.locale || 'en-US', format.options);
          if (format.options.useGrouping !== false) {
            output = output.replace(/,/g," ");
          }
        }
        if (format.expression) {
          output = format.expression.replace('{value}', output);
        }
      } else {
        if (length > 10000) {
          output = (Math.round(length / 1000 * 1000) / 1000) + ' km';
        } else {
            output = (Math.round(length * 1000) / 1000) + ' m';
        }
      }

      return output;
    };

    /**
     * Format area output.
     * @param {module:ol/geom/Polygon~Polygon} polygon The polygon.
     * @return {string} Formatted area.
     */
    this.formatArea = function(polygon) {
      let area = OlSphere.getArea(polygon, {projection: this.props.mainMap.getView().getProjection().getCode()});
      if (this.props.record.config_json && this.props.record.config_json.crs) {
        if (this.props.viewer.config_json.crs_list) {
          const prj = this.props.viewer.config_json.crs_list.find(x => x.srid === this.props.record.config_json.crs);
          if (prj) {
            const geom = polygon.clone().transform(this.props.mainMap.getView().getProjection().getCode(), prj.code);
            area = geom.getArea();
          }
        }
      }      
      
      let output = area;
      if (this.props.record?.config_json?.area?.format) {
        const format = this.props.record.config_json.area.format;

        if (format.source_unit && format.output_unit) {
          output = unit(area, format.source_unit).toNumeric(format.output_unit);
        }        
        if (format.options) {
          output = output.toLocaleString(format.locale || 'en-US', format.options);
          if (format.options.useGrouping !== false) {
            output = output.replace(/,/g," ");
          }
        }
        if (format.expression) {
          output = format.expression.replace('{value}', output);
        }
      } else if (area > 100000) {
        output = (Math.round(area / 1000000 * 1000) / 1000) + ' km2';
      } else {
        output = (Math.round(area * 1000) / 1000) + ' m2';
      }

      return output;
    };

    /**
     * Creates a new help tooltip
     */
    this.createHelpTooltip = () => {
      if (this.helpTooltipElement) {
        this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
      }
      this.helpTooltipElement = document.createElement('div');
      this.helpTooltipElement.className = 'tooltip hidden';
      this.helpTooltip = new Overlay({
        element: this.helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
      });
      this.olMap.addOverlay(this.helpTooltip);
    }
  }

  componentDidMount() {
    if (!this.props.mainMap) return;
    
    this.olMap = this.props.mainMap;
    this.draw = null;

    // Get user layer
    const layers = this.olMap.getLayers();
    //this.vector = layers.item(2).getLayers().item(0);
    this.vector = this.props.utils.findOlLayer(this.olMap, 'userlayer');

    // TODO: find user layer
    if (this.vector) {
      this.vector.setStyle(this.drawingsStyle);
      this.source = this.vector.getSource();
    }

    if (this.state.control) this.addInteraction(this.state.control);
  }

  componentDidUpdate(prevProps) {

    if (prevProps.selected_control && !this.props.selected_control) {
      //Clear previsous feature
      if (this.source) {
        const features = this.source.getFeatures();
        features.forEach((ft) => {
            if (ft.get('tool') === 'maptools') {
              this.source.removeFeature(ft);
            }
        });
      }

      this.olMap.removeInteraction(this.draw);
      this.olMap.un('pointermove', this.pointerMoveHandler);
      this.olMap.getViewport().removeEventListener('mouseout', this.onMouseOutViewport);
      if (this.helpTooltip) this.helpTooltip.setPosition(null);

      this.setState({
        ...this.state,
        helpModal: false,
        control: ''
      });      
    }

    if (this.state.control && this.props.viewer.config_json.selected_menu !== 'maptools') {
      /*
      const { actions, dispatch } = this.props;
      const { control, helpLengthShowed, helpAreaShowed } = this.state;
      */

      //Clear previsous feature
      if (this.source) {
        const features = this.source.getFeatures();
        features.forEach((ft) => {
            if (ft.get('tool') === 'maptools') {
              this.source.removeFeature(ft);
            }
        });
        //this.source.clear();
      }      

      this.olMap.removeInteraction(this.draw);
      this.olMap.un('pointermove', this.pointerMoveHandler);
      this.olMap.getViewport().removeEventListener('mouseout', this.onMouseOutViewport);
      if (this.helpTooltip) this.helpTooltip.setPosition(null);
      this.setState({
        ...this.state,
        helpModal: false,
        control: ''
      });
    }
  }  

  addInteraction(value) {
    const type = (value === 'area' ? 'Polygon' : 'LineString');
    this.draw = new OlDraw({
      source: this.source,
      type: type,
      style: this.drawStyle
    });
    this.olMap.addInteraction(this.draw);

    this.createHelpTooltip();

    let listener;
    this.draw.on('drawstart', (ev) => {

        //Clear previsous feature
        if (this.source) {
          const features = this.source.getFeatures();
          features.forEach((ft) => {
              if (ft.get('tool') == 'maptools') {
                this.source.removeFeature(ft);
              }
          });
          //this.source.clear();
        }

        // set sketch
        this.sketch = ev.feature;

        listener = this.sketch.getGeometry().on('change', (evt) => {
          const geom = evt.target;
          let output;
          if (geom instanceof Polygon) {
            output = this.formatArea(geom);
            this.setState({...this.state, area: output});
          } else if (geom instanceof LineString) {
            output = this.formatLength(geom);
            this.setState({...this.state, length: output});
          }
        });
      }, this);

    this.draw.on('drawend', (evt) => {
      
      evt.feature.set('tool', 'maptools');

      // unset sketch
      this.sketch = null;
      unByKey(listener);
    }, this);

    this.olMap.on('pointermove', this.pointerMoveHandler);
    this.olMap.getViewport().addEventListener('mouseout', this.onMouseOutViewport);
  }

  /**
   * Let user change the drawing control
   */
  changeMeasureControl(value) {
    const { actions, dispatch } = this.props;
    const { control, helpLengthShowed, helpAreaShowed } = this.state;
    this.olMap.removeInteraction(this.draw);
    this.olMap.un('pointermove', this.pointerMoveHandler);
    this.olMap.getViewport().removeEventListener('mouseout', this.onMouseOutViewport);
    if (this.helpTooltip) this.helpTooltip.setPosition(null);

    // Deactivate control
    if ((control === value) || !value) {

      //Clear previsous feature
      if (this.source) {
        const features = this.source.getFeatures();
        features.forEach((ft) => {
            if (ft.get('tool') == 'maptools') {
              this.source.removeFeature(ft);
            }
        }); 
      }     

      return this.setState({
        ...this.state,
        helpModal: false,
        control: ''
      }, () => {
        if (this.props.viewer.exclusive_mapcontrol === 'MapTools') {
          dispatch(actions.viewer_set_exclusive_mapcontrol(null));
          this.props.onControlSelect(null);
        }
      });
    }

    // Activate control
    this.addInteraction(value);
    const showHelp = (value === 'length' && !helpLengthShowed)
      || (value === 'area' && !helpAreaShowed)
    this.setState({
      ...this.state,
      helpModal: showHelp,
      control: value
    }, () => {
      dispatch(actions.viewer_set_exclusive_mapcontrol('MapTools'));
      this.props.onControlSelect(value);
    });
  }

  componentWillUnmount() {
    //Clear previsous feature
    if (this.source) {
      const features = this.source.getFeatures();
      features.forEach((ft) => {
          if (ft.get('tool') === 'maptools') {
            this.source.removeFeature(ft);
          }
      });
      //this.source.clear();
    }    
    this.sketch = null;
    this.olMap.un('pointermove', this.pointerMoveHandler);
    this.olMap.getViewport().removeEventListener('mouseout', this.onMouseOutViewport);
    if (this.helpTooltipElement) {
        this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
    }
    if (this.helpTooltip) {
        this.olMap.removeOverlay(this.helpTooltip);
    }
    this.olMap.removeInteraction(this.draw);
  }

  closeHelp() {
    const { control, helpLengthShowed, helpAreaShowed } = this.state;
    this.setState({
      ...this.state,
      helpModal: false,
      helpLengthShowed: control === 'length' ? true : helpLengthShowed,
      helpAreaShowed: control === 'area' ? true : helpAreaShowed
    });
  }

  render() {
    const { control, helpModal } = this.state;
    const controlOptions = [
      { key: 'length', label: "Medir Distância", icon: "pi pi-minus" },
      { key: 'area', label: "Medir Área", icon: "fas fa-draw-polygon" },
    ];

    return (
      <div style={{ height: '100%' }}>
        <div id="map-tools" className="plugin-main p-p-2">
          
          <SelectButton 
            optionLabel="name"
            optionValue="key"
            value={control || ''}
            options={controlOptions}
            onChange={(e) => this.changeMeasureControl(e.value)}
            itemTemplate={option => (
              <React.Fragment>
                <i className={option.icon}>&nbsp;</i>{' '}
                { option.label }
              </React.Fragment>
            )}
          />

          <div className="p-my-2">

            { control === 'length' ? (
              <InputText fluid
                label='Comprimento'
                value={this.state.length || ''}
                placeholder="Comprimento"
              />
            ) : null }

            { control === 'area' ? (
              <InputText fluid
                label='Área'
                value={this.state.area || ''}
                placeholder="Área"
              />
            ) : null }

          </div>

        </div>

        <Dialog 
          header={control === 'length' ? 'Medir Distância' : 'Medir Área'}
          visible={helpModal}
          style={{width: '50vw'}} 
          modal
          footer={(
            <Button 
              className="p-button-info"
              icon="pi pi-check"
              label="OK"
              onClick={this.closeHelp.bind(this)}
            />
          )}
          onHide={e => this.closeHelp()}>
          <div>
            { control === 'length' ? <div>
              <p>1. para começar a medição clique no mapa na localização inicial<br />
              2. para medir um trajeto clique nas localizações intermédias<br />
              3. para terminar faça duplo-clique
              </p>
            </div> : null}
            { control === 'area' ? <div>
              <p>1. para começar a medição clique no mapa numa localização inicial<br />
              2. continue clicando nas localizações que definem a área<br />
              3. para terminar faça duplo-clique
              </p>
            </div> : null}
          </div>
        </Dialog>

      </div>
    );
  }

}

export default Main;