import React from 'react'

export default function MapControlsTopRight(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_top_right',
        props: { viewer, dispatch, mainMap },
        className: "map-region-top-right"
      })}
      
    </React.Fragment>
  )
}