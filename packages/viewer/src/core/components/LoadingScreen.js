import React from 'react'
import { withRouter } from 'react-router-dom'
import { ProgressBar } from 'primereact/progressbar';


function LoadingScreen(props) {
  return (
    <div className="loadingscreen">
      <div>
        <ProgressBar mode="indeterminate" style={{ height: '6px' }}></ProgressBar>
      </div>
    </div>    
  )
}

export default withRouter(LoadingScreen);