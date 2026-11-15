import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router';
import AppContext from '../../AppContext';
import Layout from './Layout';
import PageBootError from '../components/PageBootError';
import LoadingScreen from '../components/LoadingScreen';

/**
 * Backoffice layout container
 * @param {Object} props 
 */
function Backoffice(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const history = {
    location,
    navigate,
    params
  }

  const { dispatch, backoffice, boot } = props;
  //const history = useHistory();

  // Enable redux actions
  //const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { backoffice_load, backoffice_load_reset, layout_wrapper_click, layout_toggle_menu } = core.actions;

  // Get config
  React.useEffect(() => {
    dispatch(backoffice_load(core, history));
    return () => dispatch(backoffice_load_reset());
  }, []);

  if (boot.phase === 'failed') {
    return <PageBootError error={boot.error} onRetry={() => dispatch(backoffice_load(core, history))} />;
  }

  if (boot.phase !== 'ready') return <LoadingScreen />;

  return (
    <Layout
      history={history}
      core={core}
      backoffice={backoffice}
      layout_wrapper_click={e => dispatch(layout_wrapper_click())}
      layout_toggle_menu={isDesktop => dispatch(layout_toggle_menu(isDesktop))}
    />
  );
}

export default connect(state => ({ backoffice: state.backoffice, boot: state.boot }))(Backoffice);