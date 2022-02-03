import React from 'react'

export default function MapControlsBottomRight(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_bottom_right',
        props: { viewer, dispatch, mainMap },
        className: "map-region-bottom-right"
      })}
      
    </React.Fragment>
  )
}