import React from 'react'
import MapModel from '../model/MapModel';
import OWSModel from '../model/OWSModel';
import * as Utils from '../utils';

export default function FooterRight(props) {

  const { core, viewer, dispatch, mainMap } = props;

  return (
    <React.Fragment>

      { core.renderComponents({
        region: 'footer_right',
        props: { viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
        as: "popup"
      })}
      
    </React.Fragment>
  )
}