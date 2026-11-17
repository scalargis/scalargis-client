import React from 'react';

import LocaleSelector from './LocaleSelector';
import './style.css';
export { default as configSchema } from './config.schema.json';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return null;
}

export default function Main({ type, as, config, actions, record }) {
  return (
    <LocaleSelector type={type} config={config} actions={actions} componentConfig={record?.config_json} />
  );
}