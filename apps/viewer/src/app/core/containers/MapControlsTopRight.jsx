import React, { useContext } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MapControlsTopRightComponent from '../components/MapControlsTopRight'

function MapControlsTopRight(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  const { viewer } = props;

  return (
    <MapControlsTopRightComponent
      core={core}
      mainMap={mainMap}
      dispatch={dispatch}
      viewer={viewer}
    />
  )
}

export default connect(state => ({ viewer: state.root.viewer }))(MapControlsTopRight);