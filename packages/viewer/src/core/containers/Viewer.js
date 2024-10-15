import React, { useContext, useEffect, useRef } from 'react'
import { connect, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Layout from './Layout'
import { withRouter } from 'react-router-dom'
import AppContext from '../../AppContext'
import MainMap from '../components/MainMap'
import MainMenu from './MainMenu'
import Layers from '../components/Layers'
import MorphLayer from '../components/Layers/MorphLayer'
import FooterLeft from './FooterLeft'
import FooterRight from './FooterRight'
import TopbarRight from './TopbarRight'
import MapControlsTopLeft from './MapControlsTopLeft'
import MapControlsTopCenter from './MapControlsTopCenter'
import MapControlsTopRight from './MapControlsTopRight'
import MapControlsLeft from './MapControlsLeft'
import MapControlsBottomLeft from './MapControlsBottomLeft'
import MapControlsBottomCenter from './MapControlsBottomCenter'
import MapControlsBottomRight from './MapControlsBottomRight'
import OlControls from '../map_control'
import DialogWindows from './DialogWindows'
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
  const { history, loading, viewer, config, notifications, dialogWindows } = props;
  const { exclusive_mapcontrol } = viewer;
  const { layers } = viewer.config_json;
  const { map_controls } = viewer.config_json;
  
  //Localization
  const { i18n } = useTranslation();

  // Main map
  let mainMapEl = useRef(null);
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core, mainMap } = useContext(AppContext);
  const { viewer_load, layout_wrapper_click, layout_toggle_menu, layout_show_menu, viewer_update_mapcontrol } = core.actions;

  const gaTrackingId = process.env.REACT_APP_GA_TRACKING_ID;  

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
    i18n.changeLanguage(viewer.locale);
  }, [viewer?.locale]);

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

  let rlayers = ['overlays', 'main', 'background', 'basemaps'];
  if (viewer.config_json && viewer.config_json.root_layers && viewer.config_json.root_layers.length > 0) {
    rlayers = viewer.config_json.root_layers;
  }

  const rootLayers = layers.filter(c => rlayers.includes(c.id)).reverse();
  return (
    <Layout
      history={history}
      core={core}
      viewer={viewer}
      notifications={notifications}
      dialogWindows={dialogWindows}
      layout_wrapper_click={e => dispatch(layout_wrapper_click())}
      layout_toggle_menu={isDesktop => dispatch(layout_toggle_menu(isDesktop))}
      mainMenu={<MainMenu history={history} onMenuClick={isDesktop => dispatch(layout_show_menu(isDesktop))} />}
      topbarRight={<TopbarRight />}
      footerLeft={<FooterLeft />}
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
        <MapControlsTopCenter />
        <MapControlsTopRight />
        <MapControlsLeft />
        <MapControlsBottomLeft />
        <MapControlsBottomCenter />
        <MapControlsBottomRight />

        { !!map_controls && map_controls.map(ctrl => {
          const OlControl = OlControls[ctrl.type];
          return (
            <OlControl
              core={core}
              key={ctrl.id}
              config={{ viewer, mainMap, dispatch }}
              actions={core.actions}
              record={ctrl}
            />
          )
        })}

      </MainMap>

      <DialogWindows core={core} dialogWindows={viewer?.dialogWindows} />

    </Layout>
  );
}

export default connect(state => {
  const gstate = mapStateToProps(state);
  return ({ viewer: gstate.viewer, notifications: gstate.notifications });
})(withRouter(Viewer));
