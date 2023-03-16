import React from 'react'

export default function MapControlsTopLeft(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_top_left',
        props: { viewer, dispatch, mainMap },
        className: "map-region-top-left"
      })}
      
    </React.Fragment>
  )
}