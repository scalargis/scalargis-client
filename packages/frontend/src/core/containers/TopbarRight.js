import React, { useContext, useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import TopbarRightComponent from '../components/TopbarRight'

function TopbarRight(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  let [ componentsOrdered, setComponentsOrdered ] = useState([]);
  const { viewer, components } = props;

  useEffect(() => {
    let pitems = Object.keys(components)
      .filter(k => components[k].target === 'topbar_right')
      .sort((a, b) => components[a].order > components[b].order ? 1 : -1 )
      .map(id => components[id]);
      setComponentsOrdered(pitems);
  }, [components]);

  
  return (
    <TopbarRightComponent
      core={core}
      mainMap={mainMap}
      dispatch={dispatch}
      components={componentsOrdered}
      viewer={viewer}
    />
  )
}

export default connect(state => ({
  viewer: state.root.viewer,
  components: state.root.components
}))(TopbarRight);