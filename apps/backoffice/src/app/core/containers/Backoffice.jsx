import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AppContext from '../../AppContext';
import Layout from './Layout';

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

  const { dispatch, loading, backoffice, config } = props;
  //const history = useHistory();

  // Enable redux actions
  //const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { backoffice_load, layout_wrapper_click, layout_toggle_menu, layout_set_mode, 
    layout_set_colormode } = core.actions;   

  // Get config
  React.useEffect(() => {
    dispatch(backoffice_load(core, history, true));
  }, []);

  // TODO: improve loading UI
  if (loading) return null;

  return (
    <Layout
      history={history}
      core={core}
      backoffice={backoffice}
      layout_wrapper_click={e => dispatch(layout_wrapper_click())}
      layout_toggle_menu={isDesktop => dispatch(layout_toggle_menu(isDesktop))}
      layout_set_mode={layoutMode => dispatch(layout_set_mode(layoutMode))}
      layout_set_colormode={layoutColorMode => dispatch(layout_set_colormode(layoutColorMode))}
    />
  );
}

export default connect(state => ({ backoffice: state.backoffice }))(Backoffice);