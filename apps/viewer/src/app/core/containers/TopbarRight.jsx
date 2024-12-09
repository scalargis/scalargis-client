import React, { useContext } from 'react'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import TopbarRightComponent from '../components/TopbarRight'
import { mapStateToProps } from '../utils'

function TopbarRight(props) {

  const { core, mainMap } = useContext(AppContext);
  const dispatch = useDispatch();
  const { viewer } = props;
  
  return (
    <TopbarRightComponent
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
})(TopbarRight);