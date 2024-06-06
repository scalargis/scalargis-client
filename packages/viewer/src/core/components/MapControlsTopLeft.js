import React from 'react';

import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import * as Utils from '../utils';


export default function MapControlsTopLeft(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'map_controls_top_left',
        props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
        className: "map-region-top-left"
      })}
      
    </React.Fragment>
  )
}