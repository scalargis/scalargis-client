import React from "react";

import { Button } from 'primereact/button';

import { TreeComponent } from './TreeComponent';


const KeysToComponentMap = {
  tree: TreeComponent,
  button: Button
};

function renderer(config) {
  return React.createElement(
    KeysToComponentMap[config.component] !== undefined ? KeysToComponentMap[config.component] : config.component,
    config.component ? {
      ...config.props,
      className: config.className ? config.className : null,
      style: config.style ? config.style : null
    } : {},
    config.children &&
      (typeof config.children === "string"
        ? config.children
        : config.children.map(c => renderer(c)))
  );
}

export default renderer;