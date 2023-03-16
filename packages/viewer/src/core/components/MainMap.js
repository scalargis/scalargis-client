import React, { useEffect } from 'react'
import { View } from 'ol'
import 'ol/ol.css'
import './mainmap.css'
import { connect } from 'react-redux'
import  { addProjections, transformExtent } from '../model/MapModel'

function MainMap(props) {
  let { olMap, config, viewer, mainMapEl, core, dispatch, auth } = props;

  useEffect(() => {
    if (!config) return;
    if (olMap && mainMapEl.current) olMap.setTarget(mainMapEl.current);
    const { center, extent } = config.config_json;
    const resolution = olMap.getView().getResolutionForExtent(extent);
    olMap.getView().setCenter(center);
    olMap.getView().setResolution(resolution);

    // Attach on change center event
    function onMoveEnd() {
      const center = olMap.getView().getCenter();
      const extent = olMap.getView().calculateExtent();
      dispatch(core.actions.map_set_extent(center, extent));
    }
    olMap.on('moveend', onMoveEnd);

    // Load Projections
    if (viewer.config_json.crs_list && Array.isArray(viewer.config_json.crs_list)) {
      addProjections(viewer.config_json.crs_list);
    }

    return () => {
      olMap.un('moveend', onMoveEnd);
    }
  }, [config]);

  const { center, extent } = viewer.config_json;
  useEffect(() => {
    if (!olMap) return;

    // Apply programatic center and extent
    if (extent) {
      const resolution = olMap.getView().getResolutionForExtent(extent);
      olMap.getView().setResolution(resolution);
      olMap.getView().fit(extent, olMap.getSize(), { closest: true });
    }
    else if (center) olMap.getView().setCenter(center);
  }, [center, extent]);

  const { constrained_extent, min_zoom, max_zoom, max_resolution, min_resolution,
    min_zoom_authenticated, max_zoom_authenticated, max_resolution_authenticated, min_resolution_authenticated,
  } = viewer.config_json;
  useEffect(() => {
    if (!olMap) return;
    if (!constrained_extent && !min_zoom && !max_zoom && !max_resolution && !min_resolution &&
      !min_zoom_authenticated && !max_zoom_authenticated && !max_resolution_authenticated && !min_resolution_authenticated) return;

    const viewOptions = {
      center: olMap.getView().getCenter(),
      zoom: olMap.getView().getZoom()
    }

    if (constrained_extent) viewOptions['extent'] = constrained_extent;
    if (min_zoom) viewOptions['minZoom'] = min_zoom;
    if (max_zoom) viewOptions['maxZoom'] = max_zoom;
    if (max_resolution) viewOptions['maxResolution'] = max_resolution;
    if (min_resolution) viewOptions['minResolution'] = min_resolution;

    if (auth && auth.data && auth.data.authenticated) {
      if (min_zoom_authenticated) viewOptions['minZoom'] = min_zoom_authenticated;
      if (max_zoom_authenticated) viewOptions['maxZoom'] = max_zoom_authenticated;
      if (max_resolution_authenticated) viewOptions['maxResolution'] = max_resolution_authenticated;
      if (min_resolution_authenticated) viewOptions['minResolution'] = min_resolution_authenticated;      
    }

    // Recreate view with constrained extent and min and max zoom
    olMap.setView(new View(viewOptions));    
  }, [constrained_extent, min_zoom, max_zoom, max_resolution, min_resolution, min_zoom_authenticated, max_zoom_authenticated, max_resolution_authenticated, min_resolution_authenticated]);


  // Set map size
  let map_style = {};
  if (viewer?.size?.width != null) map_style = {...map_style, width : viewer.size.width};
  if (viewer?.size?.height != null) map_style = {...map_style, height : viewer.size.height}; 

  return (
    <React.Fragment>
      <div id="map" ref={mainMapEl} style={{...map_style}} className={viewer?.className}>
        { props.children }
      </div>
    </React.Fragment>
  )
}

export default connect(state => ({
  auth: state.root.auth,
  config: state.root.config,
  viewer: state.root.viewer
}))(MainMap);
