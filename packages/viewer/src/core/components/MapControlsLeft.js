import React from 'react'

export default function MapControlsLeft(props) {

  const { core, viewer, dispatch, mainMap } = props;

  let element;

  if (viewer?.config_json?.map_controls_left_type === 'list') {
    return (
      <ul>
        { core.renderComponents({
          region: 'map_controls_left',
          element: 'ul',
          props: { viewer, dispatch, mainMap, actions: core.actions },
          className: "map-region-left-component"
        })}

        { core.renderComponentsLinks({
          region: 'map_controls_left',
          element: 'ul',
          props: { viewer, dispatch, mainMap, actions: core.actions },
          className: "map-region-left-component-link"
        })}
      </ul>
    )
  }
  
  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_left',
        element: element,
        props: { viewer, dispatch, mainMap, actions: core.actions },
        className: "map-region-left-component"
      })}

      { core.renderComponentsLinks({
        region: 'map_controls_left',
        element: element,
        props: { viewer, dispatch, mainMap, actions: core.actions },
        className: "map-region-left-component-link"
      })}         

    </React.Fragment>
  )
}