import React, { useContext, useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MainMenuComponent from '../components/MainMenu'
import { mapStateToProps } from '../utils'

function MainMenu(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  let [ componentsOrdered, setComponentsOrdered ] = useState([]);
  const { history, viewer, components, auth, onMenuClick } = props;

  useEffect(() => {
    let pitems = Object.keys(components)
      .filter(k => components[k].target === 'mainmenu')
      //.sort((a, b) => components[a].order > components[b].order ? 1 : -1 )
      .map(id => components[id]);
    
    setComponentsOrdered(pitems);

  }, [components]);
  
  return (
    <MainMenuComponent
      auth={auth}
      history={history}
      core={core}
      mainMap={mainMap}
      dispatch={dispatch}
      components={componentsOrdered}
      viewer={viewer}
      onMenuClick={onMenuClick}
    />
  )
}

export default connect(state => {
  const gstate = mapStateToProps(state);
  return ({
    viewer: gstate.viewer,
    components: gstate.components,
    auth: gstate.auth
  });
})(MainMenu);