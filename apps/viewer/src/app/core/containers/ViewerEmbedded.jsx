import React, { useContext, useEffect, useRef } from 'react'
import { connect, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import Layout from './Layout'
import { useLocation, useNavigate, useParams } from 'react-router'
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
import {PageView, initGA} from '../components/Tracking'

/**
 * Embedded Viewer layout container
 * @param {Object} props 
 */
function ViewerEmbedded(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Get router props
  const url = location?.pathname || '';
  const { id } = params;
  const { loading, viewer, config, notifications, dialogWindows } = props;
  const { exclusive_mapcontrol } = viewer;
  const { layers } = viewer.config_json;
  const { map_controls } = viewer.config_json;
  
  const history = {
    location,
    navigate,
    params
  }

  //Localization
  const { i18n } = useTranslation();

  // Main map
  const mainMapEl = useRef(null);
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core, mainMap } = useContext(AppContext);
  const { viewer_load, layout_wrapper_click, layout_toggle_menu, layout_show_menu, viewer_update_mapcontrols } = core.actions;

  const gaTrackingId = import.meta.env.VITE_APP_GA_TRACKING_ID;

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
    // Only change language if:
    // 1. viewer.locale exists AND
    // 2. There's no user preference in localStorage (OR user preference matches backend default)
    if (viewer.locale) {
      const storedLang = localStorage.getItem('i18nextLng');

      // If no stored preference, use backend default
      // If stored preference matches, no-op (already set by LanguageDetector)
      // If stored preference differs, respect user's choice (don't override)
      if (!storedLang) {
        i18n.changeLanguage(viewer.locale);
      }
    }
  }, [viewer?.locale]);

  useEffect(() => {
    // Check for lang query param and change language if present, overriding other settings
    const query =new URLSearchParams(location.search);
    const lang = query.get("lang");
    if (lang) {
      i18n.changeLanguage(lang);
    }
  }, [location]);

  useEffect(() => {
    if (!viewer.config_json) return;
    const changed = viewer.config_json.map_controls
      .filter(c => c.exclusive && !!c.active !== (c.id === exclusive_mapcontrol))
      .map(c => ({ ...c, active: c.id === exclusive_mapcontrol }));
    if (changed.length) dispatch(viewer_update_mapcontrols(changed));
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
      mode="embedded"
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
          if (!OlControl) return null;
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

export default connect(state => ({
  viewer: state.root.viewer,
  notifications: state.root.notifications
}))(ViewerEmbedded);
