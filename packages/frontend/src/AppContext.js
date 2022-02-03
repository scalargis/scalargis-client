import React from 'react'
import Core from './Core'
import rootReducer from './core/reducers'
import { Map, View } from 'ol'
import OlCollection from 'ol/Collection';

const BASE_URL = process.env.REACT_APP_BASE_URL || '/'
export const core = new Core({ BASE_URL }, rootReducer)

let options = {
  controls: new OlCollection(),
  interactions: new OlCollection(),
  view: new View({
    center: [-878528, 4465088],
    zoom: 12,
    //rotation: -Math.PI / 8
  })
};
export const mainMap = new Map(options);

const AppContext = React.createContext();

export default AppContext