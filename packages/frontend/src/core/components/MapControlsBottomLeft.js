import React from 'react'

export default function MapControlsBottomLeft(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_bottom_left',
        props: { viewer, dispatch, mainMap },
        className: "map-region-bottom-left"
      })}
      
    </React.Fragment>
  )
}