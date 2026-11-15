import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router';
import AppContext from '../../AppContext';
import Layout from './Layout';
import PageBootError from '../components/PageBootError';

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

  const { dispatch, loading, backoffice, config, bootError } = props;
  //const history = useHistory();

  // Enable redux actions
  //const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { backoffice_load, layout_wrapper_click, layout_toggle_menu } = core.actions;

  // Get config
  React.useEffect(() => {
    dispatch(backoffice_load(core, history, true));
  }, []);

  // TODO: improve loading UI
  if (loading) return null;

  if (bootError) {
    return <PageBootError error={bootError} onRetry={() => dispatch(backoffice_load(core, history))} />;
  }

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

export default connect(state => ({ backoffice: state.backoffice, bootError: state.bootError }))(Backoffice);