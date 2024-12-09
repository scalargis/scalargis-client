import React, { useContext } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MapControlsBottomRightComponent from '../components/MapControlsBottomRight'
import { mapStateToProps } from '../utils'

function MapControlsBottomRight(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  const { viewer } = props;
  
  return (
    <MapControlsBottomRightComponent
      core={core}
      mainMap={mainMap}
      dispatch={dispatch}
      viewer={viewer}
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
})(MapControlsBottomRight);