import React, { useContext } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MapControlsLeftComponent from '../components/MapControlsLeft'

function MapControlsLeft(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  const { viewer } = props;
  
  return (
    <div className="map-region-left">
      <MapControlsLeftComponent
        core={core}
        mainMap={mainMap}
        dispatch={dispatch}
        viewer={viewer}
      />
    </div>
  )
}

export default connect(state => ({ viewer: state.root.viewer }))(MapControlsLeft);