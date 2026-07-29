import React from "react";

import { Button } from '@mantine/core';

import { TreeComponent } from './TreeComponent';


/** Config-compat Button: existing panel configs carry Prime's `label`/`icon`
 *  props, which Mantine's Button does not know. */
const ConfigButton = ({ label, icon, options, children, ...rest }) => (
  <Button leftSection={icon ? <i className={icon} aria-hidden="true" /> : undefined} {...rest}>
    {children || label}
  </Button>
);

const KeysToComponentMap = {
  tree: TreeComponent,
  button: ConfigButton
};

function renderer(config) {
  return React.createElement(
    KeysToComponentMap[config.component] !== undefined ? KeysToComponentMap[config.component] : config.component,
    config.component ? {
      ...config.props,
      className: config.className ? config.className : null,
      style: config.style ? config.style : null,
      options: config.options ? config.options : null
    } : {},
    config.children &&
      (typeof config.children === "string"
        ? config.children
        : config.children.map((c, i) => <React.Fragment key={i}>{renderer(c)}</React.Fragment>))
  );
}

export default renderer;
