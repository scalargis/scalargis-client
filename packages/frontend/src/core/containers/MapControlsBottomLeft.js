import React, { useContext, useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MapControlsBottomLeftComponent from '../components/MapControlsBottomLeft'

function MapControlsBottomLeft(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  let [ componentsOrdered, setComponentsOrdered ] = useState([]);
  const { viewer, components } = props;

  useEffect(() => {
    let pitems = Object.keys(components)
      .filter(k => components[k].target === 'map_controls_bottom_left')
      .sort((a, b) => components[a].order > components[b].order ? 1 : -1 )
      .map(id => components[id]);
      setComponentsOrdered(pitems);
  }, [components]);

  
  return (
    <MapControlsBottomLeftComponent
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
}))(MapControlsBottomLeft);