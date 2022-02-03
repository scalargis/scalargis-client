import React, { useContext, useEffect, useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MapControlsLeftComponent from '../components/MapControlsLeft'

function MapControlsLeft(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  const [ componentsOrdered, setComponentsOrdered ] = useState([]);
  const { viewer, components } = props;

  useEffect(() => {
    let pitems = Object.keys(components)
      .filter(k => components[k].target === 'map_controls_left' || components[k].links=== 'map_controls_left')
      .sort((a, b) => components[a].order > components[b].order ? 1 : -1 )
      .map(id => components[id]);
      setComponentsOrdered(pitems);
  }, [components]);

  
  return (
    <div className="map-region-left">
      <MapControlsLeftComponent
        core={core}
        mainMap={mainMap}
        dispatch={dispatch}
        components={componentsOrdered}
        viewer={viewer}
      />
    </div>
  )
}

export default connect(state => ({
  viewer: state.root.viewer,
  components: state.root.components
}))(MapControlsLeft);