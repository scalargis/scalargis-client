import React, { useContext, useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MainMenuComponent from '../components/MainMenu'

function MainMenu(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  const [ componentsOrdered, setComponentsOrdered ] = useState([]);
  const { mode, history, viewer, components, auth, onMenuClick } = props;

  useEffect(() => {
    const pitems = Object.keys(components)
      .filter(k => components[k].target === 'mainmenu')
      //.sort((a, b) => components[a].order > components[b].order ? 1 : -1 )
      .map(id => components[id]);
    
    setComponentsOrdered(pitems);

  }, [components]);

  return (
    <MainMenuComponent
      mode={mode}
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

export default connect(state => ({
  viewer: state.root.viewer,
  components: state.root.components,
  auth: state.root.auth
}))(MainMenu);