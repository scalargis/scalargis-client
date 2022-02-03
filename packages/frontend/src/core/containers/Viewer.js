import React, { useContext, useEffect, useRef } from 'react'
import { connect, useDispatch } from 'react-redux'
import Layout from './Layout'
import { withRouter } from 'react-router-dom'
import AppContext from '../../AppContext'
import MainMap from '../components/MainMap'
import MainMenu from './MainMenu'
import Layers from '../components/Layers'
import MorphLayer from '../components/Layers/MorphLayer'
import FooterRight from './FooterRight'
import TopbarRight from './TopbarRight'
import MapControlsTopLeft from './MapControlsTopLeft'
import MapControlsTopRight from './MapControlsTopRight'
import MapControlsLeft from './MapControlsLeft'
import MapControlsBottomLeft from './MapControlsBottomLeft'
import MapControlsBottomRight from './MapControlsBottomRight'
import OlControls from '../map_control'
import { mapStateToProps } from '../utils'
import {PageView, initGA} from '../components/Tracking'

/**
 * Viewer layout container
 * @param {Object} props 
 */
function Viewer(props) {

  // Get router props
  const { url } = props.match;
  const { id } = props.match.params;
  const { history, loading, viewer, config } = props;
  const { exclusive_mapcontrol } = viewer;
  const { layers } = viewer.config_json;
  const { map_controls } = viewer.config_json;
  
  // Main map
  let mainMapEl = useRef(null);
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core, mainMap } = useContext(AppContext);
  const { viewer_load, layout_wrapper_click, layout_toggle_menu, layout_show_menu, viewer_update_mapcontrol } = core.actions;

  const gaTrackingId = process.env.REACT_APP_GA_TRACKING_ID;

  function isDesktop() {
    return window.innerWidth > 1024;
  }

  // Get config
  React.useEffect(() => {
    if (gaTrackingId) {
      initGA(gaTrackingId);
      PageView();
    }

    if (url.indexOf('/session') < 0) {
      dispatch(viewer_load(core, id, history));
    } else {
      dispatch(viewer_load(core, id, history, true));
    }
  }, [id]);

  useEffect(() => {
    if (!viewer.config_json) return;
    viewer.config_json.map_controls.filter(c => c.exclusive).forEach(control => {
      if (control.id === exclusive_mapcontrol) {
        dispatch(viewer_update_mapcontrol({ ...control, active: true }));
      } else {
        dispatch(viewer_update_mapcontrol({ ...control, active: false }));
      }
    });
  }, [exclusive_mapcontrol]);

  // TODO: improve loading UI
  if (loading) return null;

  const rootLayers = layers.filter(c => ['overlays', 'main', 'basemaps'].includes(c.id)).reverse();
  return (
    <Layout
      history={history}
      core={core}
      viewer={viewer}
      layout_wrapper_click={e => dispatch(layout_wrapper_click())}
      layout_toggle_menu={isDesktop => dispatch(layout_toggle_menu(isDesktop))}
      mainMenu={<MainMenu history={history} onMenuClick={isDesktop => dispatch(layout_show_menu(isDesktop))} />}
      topbarRight={<TopbarRight />}
      footerRight={<FooterRight />}
      mainOlMap={mainMap}
    >
      <MainMap 
        olMap={mainMap}
        config={config}
        viewer={viewer}
        mainMapEl={mainMapEl}
        dispatch={dispatch}
        core={core}
      >
        <Layers>
          { rootLayers.map(c =>
            
            <MorphLayer
              key={c.id}
              config={c}
              layers={layers}
              checked={viewer.config_json.checked}
              viewer={viewer}
            />

          ) }
        </Layers>

        <MapControlsTopLeft />
        <MapControlsTopRight />
        <MapControlsLeft />
        <MapControlsBottomLeft />
        <MapControlsBottomRight />

        { !!map_controls && map_controls.map(ctrl => {
          const OlControl = OlControls[ctrl.type];
          return (
            <OlControl
              key={ctrl.id}
              config={{ viewer, mainMap, dispatch }}
              actions={core.actions}
              record={ctrl}
            />
          )
        })}

      </MainMap>
    </Layout>
  );
}

export default connect(state => {
  const gstate = mapStateToProps(state);
  return ({ viewer: gstate.viewer });
})(withRouter(Viewer));
