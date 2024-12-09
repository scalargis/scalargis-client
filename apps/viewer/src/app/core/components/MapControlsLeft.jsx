import React from 'react'

export default function MapControlsLeft(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_left',
        props: { viewer, dispatch, mainMap, actions: core.actions },
        className: "map-region-left-component"
      })}

      { core.renderComponentsLinks({
        region: 'map_controls_left',
        props: { viewer, dispatch, mainMap, actions: core.actions },
        className: "map-region-left-component-link"
      })}         

    </React.Fragment>
  )
}