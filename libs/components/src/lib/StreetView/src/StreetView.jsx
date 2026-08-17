import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@mantine/hooks';
import { Dialog, useIsMobile } from '@scalargis/ui';

import { MapToolButton } from '../../components';

import { transform } from 'ol/proj';
import 'ol/ol.css';
import Overlay from 'ol/Overlay';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { containsXY } from 'ol/extent';
import {
  Circle as OlStyleCircle, Fill as OlStyleFill, Stroke as OlStyleStroke,
  Icon as OlStyleIcon, Style as OlStyle
} from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import { I18N_NAMESPACE } from './i18n/index';
import './style.css';


export default function StreetView({ core, viewer, mainMap, dispatch, actions, record, utils }) {

  const { exclusive_mapcontrol } = viewer;

  const streetview_control = record;
  const { viewer_update_mapcontrol, viewer_set_selectedmenu, map_set_extent, viewer_set_exclusive_mapcontrol, viewer_add_notification } = actions;

  const [modalStreetViewOpen, { open: openStreetView, close: closeStreetView }] = useDisclosure(false);

  const [position, setPosition] = useState();
  const [pov, setPov] = useState();

  // The pano mount target is tracked as STATE, not a ref: the mount effect below
  // needs to run the moment the div is attached, and the Dialog only renders its
  // body once opened (with a transition). A ref would be null when an effect
  // keyed on `opened` first fired, and — since `opened` never changes again —
  // the effect would never re-run and the pano would stay blank. A callback ref
  // to setState re-runs the effect exactly when the node attaches/detaches.
  const [panoNode, setPanoNode] = useState(null);
  const streetviewLayer = useRef();
  const panorama = useRef();

  // Tooltip refs
  const helpTooltipElement = useRef();
  const helpTooltip = useRef(null);

  const isMobile = useIsMobile();

  const component_cfg = record.config_json || {};
  const title = record.title || 'Google StreetView';
  const header = component_cfg.header || title;
  const openNewWindow = component_cfg.openNewWindow || false;

  const { t } = useTranslation([I18N_NAMESPACE, 'custom']);

  const streetviewStyle = new OlStyle({
    fill: new OlStyleFill({
      color: 'rgba(255, 0, 0, 0.2)',
    }),
    image: new OlStyleIcon({
      src: core.CLIENT_URL + 'assets/images/location-heading.svg',
      imgSize: [27, 55]
    }),
  });

  const createStyle = (props, rotation) => {

    const { fill, stroke, image } = props;
    const style = streetviewStyle.clone();

    try {
      if (fill) {
        style.setFill(new OlStyleFill(fill));
      }
      if (stroke) {
        style.setStroke(new OlStyleStroke(stroke));
      }
      if (image) {
        if (image.icon) {
          const { displacement, scale, color, rotateWithView } = image.icon;
          const iconStyle = new OlStyleIcon({
            imgSize: image.icon.imgSize || style.getImage().getSize(),
            src: image.icon.src ? core.CLIENT_URL + image.icon.src : style.getImage().getSrc(),
            color,
            displacement,
            scale,
            rotation,
            rotateWithView
          });
          style.setImage(iconStyle);
        } else {
          const { radius, displacement, scale, rotateWithView } = image;
          const circleStyle = new OlStyleCircle({
            fill: image.fill ? new OlStyleFill(image.fill) : null,
            stroke: image.stroke ? new OlStyleStroke(image.stroke) : null,
            radius,
            displacement,
            scale,
            rotateWithView
          });
          style.setImage(circleStyle);
        }
      }
    } catch (error) {
      console.log(error);
    }

    return style;
  }


  // Add StreetView layer
  useEffect(() => {
    if (!mainMap) return;

    streetviewLayer.current = new VectorLayer({
      id: 'streetview',
      renderMode: 'vector',
      source: new Vector({}),
      selectable: false
    });
    streetviewLayer.current.setStyle(streetviewStyle);

    //const parentLayer = utils.findOlLayer(mainMap, 'overlays');
    mainMap.addLayer(streetviewLayer.current);

  }, [mainMap]);


  useEffect(() => {
    if (!exclusive_mapcontrol) return;

    if (exclusive_mapcontrol === 'StreetView') mainMap.on('singleclick', streetviewSingleClick);
    else mainMap.un('singleclick', streetviewSingleClick);

    return () => {
      mainMap.un('singleclick', streetviewSingleClick);
    }
  }, [exclusive_mapcontrol]);


  // Tooltip — show a cursor-following hint when the StreetView tool is first activated

  const pointerMoveHandler = useRef((evt) => {
    if (evt.dragging) return;
    helpTooltipElement.current.innerHTML = t('streetViewTooltip', 'Click a point on the map to view it in Google Street View');
    helpTooltip.current.setPosition(evt.coordinate);
    helpTooltipElement.current.classList.remove('hidden');
  });

  const onMouseOutViewport = () => {
    if (helpTooltipElement.current) helpTooltipElement.current.classList.add('hidden');
  };

  const createHelpTooltip = () => {
    if (helpTooltipElement.current) {
      helpTooltipElement?.current?.parentNode && helpTooltipElement.current.parentNode.removeChild(helpTooltipElement.current);
    }
    helpTooltipElement.current = document.createElement('div');
    helpTooltipElement.current.className = 'streetview-tooltip hidden';
    helpTooltip.current = new Overlay({
      element: helpTooltipElement.current,
      offset: [15, 0],
      positioning: 'center-left',
    });
    mainMap.addOverlay(helpTooltip.current);
  };

  const clearHelpTooltip = () => {
    if (helpTooltipElement.current) {
      helpTooltipElement?.current?.parentNode && helpTooltipElement.current.parentNode.removeChild(helpTooltipElement.current);
    }
    if (helpTooltip.current) {
      helpTooltip.current.setPosition(null);
      mainMap.removeOverlay(helpTooltip.current);
    }
  };

  useEffect(() => {
    if (!mainMap) return;
    if (!viewer?.loaded) return;

    let tooltipTimer;

    if (exclusive_mapcontrol === 'StreetView') {
      createHelpTooltip();
      mainMap.on('pointermove', pointerMoveHandler.current);
      mainMap.getViewport().addEventListener('mouseout', onMouseOutViewport);

      tooltipTimer = setTimeout(() => {
        clearHelpTooltip();
        mainMap.un('pointermove', pointerMoveHandler.current);
        mainMap.getViewport().removeEventListener('mouseout', onMouseOutViewport);
      }, 3000);
    }

    return () => {
      if (tooltipTimer) clearTimeout(tooltipTimer);
      if (exclusive_mapcontrol === 'StreetView') {
        mainMap.un('pointermove', pointerMoveHandler.current);
        mainMap.getViewport().removeEventListener('mouseout', onMouseOutViewport);
      }
      clearHelpTooltip();
    }
  }, [exclusive_mapcontrol, viewer?.loaded, mainMap]);


  // Toggle StreetView control
  function toggleStreetViewControl() {
    if (exclusive_mapcontrol !== 'StreetView') {
      dispatch(viewer_set_exclusive_mapcontrol('StreetView'));
      dispatch(viewer_add_notification({
        group: "viewer",
        message: {
          severity: "info",
          summary: title,
          detail: "Ferramenta Street View ativada - clique no mapa para usar"
        }
      }));
    } else {
      dispatch(viewer_set_exclusive_mapcontrol(null));
      dispatch(viewer_add_notification({
        group: "viewer",
        message: {
          severity: "info",
          summary: title,
          detail: "Ferramenta Street View desativada"
        }
      }));
    }
  }

  function streetviewSingleClick(e) {
    const lonlat = transform(e.coordinate, mainMap.getView().getProjection().getCode(), 'EPSG:4326');

    if (openNewWindow) {
      // Open in new window using Google Maps URL scheme, no api key needed
      const url_params = { lat: lonlat[1], lng: lonlat[0], heading: 34, pitch: 10, fov: 80 };
      // Single line: the template literal must not bake the newline + indentation
      // into viewpoint=, or the URL is malformed and the pano fails to open.
      const browser_url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${url_params.lat},${url_params.lng}&heading=${url_params.heading}&pitch=${url_params.pitch}&fov=${url_params.fov}`;
      window.open(browser_url, "_blank", "noopener,noreferrer");
    } else {
      // Handle opening in portal dialog with embedded StreetView
      if (streetviewLayer?.current) {
        const source = streetviewLayer.current.getSource();

        if (source) {
          source.clear();

          const feature = new Feature({
            geometry: new Point(e.coordinate)
          });
          source.addFeature(feature);
        }
      }

      if (panorama?.current) {
        const newPos = new window.google.maps.LatLng(lonlat[1], lonlat[0]);
        panorama.current.setPosition(newPos);
      } else {
        setPosition(lonlat);
        openStreetView();
      }
    }
  }

  // Mount the panorama into the dialog body once it opens. Prime did this in
  // the Dialog's onShow with getContent(); here the ref'd div is the target
  // and a ResizeObserver replaces onResizeEnd — it fires on maximize/restore
  // and on any other body resize, retriggering the pano's self-measure.
  useEffect(() => {
    if (!modalStreetViewOpen || !panoNode || !position) return;

    const panoramaOptions = {
      position: new window.google.maps.LatLng(position[1], position[0]),
      pov: {
        heading: 34,
        pitch: 10
      }
    };
    const pan = new window.google.maps.StreetViewPanorama(panoNode, panoramaOptions);
    // Assign BEFORE wiring listeners: position_changed can fire during init and
    // both handlers read panorama.current, which was previously set only after.
    panorama.current = pan;
    pan.addListener('position_changed', function () {
      const pos = panorama.current.getPosition();
      const pov = panorama.current.getPov();

      const coords = transform([pos.lng(), pos.lat()], 'EPSG:4326', mainMap.getView().getProjection().getCode());

      if (streetviewLayer?.current) {
        const source = streetviewLayer.current.getSource();

        if (source) {
          source.clear();

          const rotation = (Math.PI / 180) * pov.heading;
          const style = createStyle(record?.config_json?.style, rotation);

          const feature = new Feature({
            geometry: new Point(coords)
          });
          feature.setStyle(style);
          source.addFeature(feature);

          /*Tacking modes
          //  extent - only move map if position is outside map extent
          //  always - alway move map to position
          */
          if (record?.config_json?.tracking) {
            if (record.config_json.tracking === 'extent') {
              const extent = mainMap.getView().calculateExtent(mainMap.getSize());
              if (!containsXY(extent, coords[0], coords[1])) {
                mainMap.getView().animate({
                  center: coords
                });
              }
            } else if (record.config_json.tracking === 'always') {
              mainMap.getView().animate({
                center: coords
              });
            }
          }
        }
      }
    });
    pan.addListener('pov_changed', function () {
      const pos = panorama.current.getPosition();
      const pov = panorama.current.getPov();

      const coords = transform([pos.lng(), pos.lat()], 'EPSG:4326', mainMap.getView().getProjection().getCode());
      if (streetviewLayer?.current) {
        const source = streetviewLayer.current.getSource();

        if (source) {
          source.clear();

          const rotation = (Math.PI / 180) * pov.heading;
          const style = createStyle(record?.config_json?.style, rotation);

          const feature = new Feature({
            geometry: new Point(coords)
          });
          feature.setStyle(style);
          source.addFeature(feature);
        }
      }
    });

    // The Modal mounts its body with a transition, so the container can measure
    // 0×0 on this first commit and Google paints blank until told to remeasure.
    // ResizeObserver fires an initial notification on observe() and again on
    // maximize/restore; each triggers the pano's self-measure so it repaints.
    // A trailing re-trigger on the next frame catches the settled size — on
    // maximize the observer can fire mid-layout, leaving the pano measured at an
    // intermediate width (a black band down the right edge) until it repaints.
    let rafOuter = 0;
    let rafInner = 0;
    const resizeObserver = new ResizeObserver(() => {
      window.google.maps.event.trigger(pan, 'resize');
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      // Double rAF: the first frame lets the maximized layout commit, the second
      // fires post-paint against the settled size, so the pano fills instantly
      // instead of measuring an intermediate width (the trailing black band).
      rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(() => window.google.maps.event.trigger(pan, 'resize'));
      });
    });
    resizeObserver.observe(panoNode);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
    };
  }, [modalStreetViewOpen, panoNode, position]);

  //Exit if google maps script is not loaded, and component is not configured to open in a new window
  if (!(window.google && window.google.maps) && !openNewWindow) return null;

  return (
    <React.Fragment>
      <div id="streetview" className="streetview">
        <MapToolButton
          title={title}
          icon="fas fa-street-view"
          active={exclusive_mapcontrol === 'StreetView'}
          onClick={e => { e.currentTarget.blur(); toggleStreetViewControl() }}
        />
      </div>

      <Dialog
        title={header}
        opened={!!modalStreetViewOpen}
        size={isMobile ? '90%' : '50vw'}
        height="80vh"
        maximizable
        withOverlay={false}
        lockScroll={false}
        trapFocus={false}
        closeOnClickOutside={false}
        onClose={e => {
          if (streetviewLayer?.current) {
            const source = streetviewLayer.current.getSource();
            if (source) source.clear();
          }
          if (panorama?.current) panorama.current = null;
          closeStreetView();
          if (exclusive_mapcontrol === 'StreetView') {
            dispatch(viewer_set_exclusive_mapcontrol(null));
          }
        }}>
        <div ref={setPanoNode} style={{ width: '100%', height: '100%' }} />
      </Dialog>
    </React.Fragment>
  )
}