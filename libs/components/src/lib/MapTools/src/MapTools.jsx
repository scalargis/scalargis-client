import React, { useState, useRef, useEffect } from 'react';
import { useTranslation} from "react-i18next";
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
import convert from 'convert';
import './style.css';


// Drawing style
const drawingsStyle = new OlStyle({
  fill: new OlFill({
    color: 'rgba(255, 255, 255, 0.2)'
  }),
  stroke: new OlStroke({
    color: '#ffcc33',
    width: 2
  })
});

// Draw style
const drawStyle = new OlStyle({
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


export default function MapTools({ selectedControl, onControlSelect, core, viewer, actions, dispatch, mainMap, utils, record }) {
  
  const { exclusive_mapcontrol } = viewer;
  const { showOnPortal, getWindowSize } = utils;

  const { t } = useTranslation();

  const [length, setLength] = useState(0);
  const [area, setArea] = useState(0);
  const [helpModal, setHelpModal] = useState(false);
  const [helpLengthShowed, setHelpLengthShowed] = useState(false);
  const [helpAreaShowed, setHelpAreaShowed] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const layer = useRef();
  const draw = useRef();

  /**
   * Currently drawn feature.
   * @type {module:ol/Feature~Feature}
   */
    const sketch = useRef(null);
  
  /**
   * The help tooltip element.
   * @type {Element}
   */
  const helpTooltipElement = useRef();

  /**
   * Overlay to show the help messages.
   * @type {module:ol/Overlay}
   */
  const helpTooltip = useRef(null);


  /**
   * Handle pointer move.
   * @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt The event.
   */
  const pointerMoveHandler = useRef((evt) => {
    if (evt.dragging) {
        return;
    }
    /** @type {string} */
    let helpMsg = t('measureMsgStartDrawing', startDrawingMsg)

    if (sketch?.current) {
        const geom = (sketch.current.getGeometry());
        if (geom instanceof Polygon) {
        helpMsg = t('measureMsgContinuePolygon', continuePolygonMsg);
        } else if (geom instanceof LineString) {
        helpMsg = t('measureMsgContinueLine', continueLineMsg);
        }
    }

    helpTooltipElement.current.innerHTML = helpMsg;
    helpTooltip.current.setPosition(evt.coordinate);

    helpTooltipElement.current.classList.remove('hidden');
  });


  useEffect(() => {
    if (!mainMap) return;

    if (!viewer?.loaded) return;

    // Get user layer
    layer.current = utils.findOlLayer(mainMap, 'userlayer');
    if (layer?.current) layer.current.setStyle(drawingsStyle);

    return () => {
      if (mainMap) {
        draw.current && mainMap.removeInteraction(draw.current);
        mainMap.getViewport().removeEventListener('mouseout', onMouseOutViewport);

        clearMeasureFeature();
        clearHelpTooltip();
      }
    }

  }, [viewer?.loaded, mainMap]);

  useEffect(() => {
    if (!(viewer?.exclusive_mapcontrol === 'MapTools')) {
      onControlSelect(null);
    }
  }, [viewer?.exclusive_mapcontrol]);

  useEffect(() => {    
    if (draw.current) mainMap.removeInteraction(draw.current);
    draw.current = null;

    if (!mainMap) return;
    if (!layer.current) return;

    if(!selectedControl) {
      clearMeasureFeature();
      clearHelpTooltip();
      if (exclusive_mapcontrol === 'MapTools') {
        dispatch(actions.viewer_set_exclusive_mapcontrol(null));
      }
      return;
    }

    // Show length tool help
    if (selectedControl === 'length' && !helpLengthShowed) setHelpModal(true);
    // Show area tool help
    if (selectedControl === 'area' && !helpAreaShowed) setHelpModal(true);

    dispatch(actions.viewer_set_exclusive_mapcontrol('MapTools'));

    const source = layer.current.getSource();

    const type = selectedControl == 'area' ? 'Polygon' : 'LineString';
    draw.current = new OlDraw({
      source: source,
      type: type,
      style: drawStyle
      /*
      style: function (feature) {
        const geometryType = feature.getGeometry().getType();
        if (geometryType === type || geometryType === 'Point') {
          return style;
        }
      },
      */
    });
    mainMap.addInteraction(draw.current);

    createHelpTooltip();

    let listener;
    draw.current.on('drawstart', (ev) => {
      const source = layer.current.getSource();
      //Clear previsous feature
      if (source) {
        const features = source.getFeatures();
        features.forEach((ft) => {
          if (ft.get('tool') == 'maptools') {
            source.removeFeature(ft);
          }
        });
      }

      // set sketch
      sketch.current = ev.feature;

      listener = sketch.current.getGeometry().on('change', (evt) => {
        const geom = evt.target;
        let output;
        if (geom instanceof Polygon) {
          output = formatArea(geom);
          setArea(output);
        } else if (geom instanceof LineString) {
          output = formatLength(geom);
          setLength(output);
        }
      });

      draw.current.on('drawend', (evt) => {
        evt.feature.set('tool', 'maptools');
        // unset sketch
        sketch.current = null;
        unByKey(listener);
      });
    });

    mainMap.on('pointermove', pointerMoveHandler.current);
    mainMap.getViewport().addEventListener('mouseout', onMouseOutViewport);

  }, [selectedControl]);

  const closeHelp = () => {
    setHelpModal(false);
    if (selectedControl === 'length') setHelpLengthShowed(true);
    if (selectedControl === 'area') setHelpAreaShowed(true);
  }

  /**
   * Format length output.
   * @param {module:ol/geom/LineString~LineString} line The line.
   * @return {string} The formatted length.
   */
  const formatLength = (line) => {
    let length = OlSphere.getLength(line, {projection: mainMap.getView().getProjection().getCode()});
    if (record.config_json && record.config_json.crs) {
      if (viewer.config_json.crs_list) {
        const prj = viewer.config_json.crs_list.find(x => x.srid === record.config_json.crs);
        if (prj) {
          const geom = line.clone().transform(mainMap.getView().getProjection().getCode(), prj.code);
          length = geom.getLength();
        }
      }
    }

    let output = length;
    if (record?.config_json?.length?.format) {
      const format = record.config_json.length.format;

      if (format.source_unit && format.output_unit) {
        output = convert(length, format.source_unit).to(format.output_unit);
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
  * Message to show before user start drawing.
  * @type {string}
  */
  const startDrawingMsg = 'Clique para começar a desenhar';

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
   * Format area output.
   * @param {module:ol/geom/Polygon~Polygon} polygon The polygon.
   * @return {string} Formatted area.
   */
  const formatArea = (polygon) => {
    let area = OlSphere.getArea(polygon, {projection: mainMap.getView().getProjection().getCode()});
    if (record.config_json && record.config_json.crs) {
      if (viewer.config_json.crs_list) {
        const prj = viewer.config_json.crs_list.find(x => x.srid === record.config_json.crs);
        if (prj) {
          const geom = polygon.clone().transform(mainMap.getView().getProjection().getCode(), prj.code);
          area = geom.getArea();
        }
      }
    }      
    
    let output = area;
    if (record?.config_json?.area?.format) {
      const format = record.config_json.area.format;

      if (format.source_unit && format.output_unit) {
        output = convert(area, format.source_unit).to(format.output_unit);
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
  const createHelpTooltip = () => {
    if (helpTooltipElement.current) {
      helpTooltipElement?.current?.parentNode && helpTooltipElement.current.parentNode.removeChild(helpTooltipElement.current);
    }
    helpTooltipElement.current = document.createElement('div');
    helpTooltipElement.current.className = 'tooltip hidden';
    helpTooltip.current = new Overlay({
      element: helpTooltipElement.current,
      offset: [15, 0],
      positioning: 'center-left',
    });
    mainMap.addOverlay(helpTooltip.current);
  }

  /**
   * Clear active help tooltip
   */
  const clearHelpTooltip = () => {
    if (helpTooltipElement.current) {
      helpTooltipElement?.current?.parentNode && helpTooltipElement.current.parentNode.removeChild(helpTooltipElement.current);
    }
    if (helpTooltip.current) {
      helpTooltip.current.setPosition(null);
      mainMap.removeOverlay(helpTooltip.current);
    }
  }

  /**
   * Clear active measure feature 
   */
  const clearMeasureFeature = () => {
    if (!layer.current) return;

    const source = layer.current.getSource();
    //Clear previsous feature
    if (source) {
      const features = source.getFeatures();
      features.forEach((ft) => {
        if (ft.get('tool') == 'maptools') {
          source.removeFeature(ft);
        }
      });
    }
  }

  const onMouseOutViewport = () => {
    if (helpTooltipElement.current) helpTooltipElement.current.classList.add('hidden');
  }

  const render = () => {
    //const { control, helpModal } = this.state;
    const controlOptions = [
      { key: 'length', label: t("measureDistance", "Medir Distância"), icon: "pi pi-minus" },
      { key: 'area', label: t("measureArea", "Medir Área"), icon: "fas fa-draw-polygon" },
    ];

    return (
      <div style={{ height: '100%' }}>
        <div id="map-tools" className="plugin-main p-2">
          
          <SelectButton 
            optionLabel="name"
            optionValue="key"
            value={selectedControl || ''}
            options={controlOptions}
            onChange={(e) => onControlSelect(e.value)}
            itemTemplate={option => (
              <React.Fragment>
                <i className={option.icon}>&nbsp;</i>{' '}
                { option.label }
              </React.Fragment>
            )}
          />

          <div className="mt-2">

            { selectedControl === 'length' ? (
              <InputText
                label={t("length", "Comprimento")}
                value={length || ''}
                placeholder={t("length", "Comprimento")}
              />
            ) : null }

            { selectedControl === 'area' ? (
              <InputText
                label={t("area", "Área")}
                value={area || ''}
                placeholder={t("area", "Área")}
              />
            ) : null }

          </div>

        </div>

        {showOnPortal(<Dialog 
          header={selectedControl === 'length' ? t("measureDistance", "Medir Distância") : t("measureArea", "Medir Área")}
          visible={helpModal}
          _style={{width: '50vw'}}
          style={{ width: isMobile ? '90%' : null }} 
          modal
          footer={(
            <Button 
              className="p-button-info"
              icon="pi pi-check"
              label="OK"
              onClick={closeHelp}
            />
          )}
          onHide={e => closeHelp()}>
          <div>
            { selectedControl === 'length' ? <div>
              <p dangerouslySetInnerHTML={{__html: t("measureInfoDistance", "1. para começar a medição clique no mapa na localização inicial<br /> 2. para medir um trajeto clique nas localizações intermédias<br /> 3. para terminar faça duplo-clique")}}
              />
            </div> : null}
            { selectedControl === 'area' ? <div>
              <p dangerouslySetInnerHTML={{__html: t("measureInfoArea", "1. para começar a medição clique no mapa numa localização inicial<br />2. continue clicando nas localizações que definem a área<br />3. para terminar faça duplo-clique")}}
              />
            </div> : null}
          </div>
        </Dialog>)}

      </div>
    );
  }

  return render();

}