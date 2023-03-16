import React, { useContext } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import MapControlsLeftComponent from '../components/MapControlsLeft'
import { mapStateToProps } from '../utils'

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

export default connect(state => {
  const gstate = mapStateToProps(state);
  return ({
    viewer: gstate.viewer,
    components: gstate.components,
    auth: gstate.auth
  });
})(MapControlsLeft);