import { coreComponentSchemas } from '@scalargis/components';

const files = import.meta.glob('../../../../../../viewer/src/app/components/*/src/config.schema.json', { eager: true, import: 'default' });

/** Returns the config schema of each outside component in the viewer build, by its folder name. */
function loadOutsideSchemas() {
  const out = {};
  for (const [path, schema] of Object.entries(files)) {
    const type = path.split('/').slice(-3)[0];
    if (!type || coreComponentSchemas[type] || !schema || typeof schema !== 'object') continue;
    out[type] = schema;
  }
  return out;
}

export const outsideComponentSchemas = loadOutsideSchemas();

export const componentSchemas = { ...outsideComponentSchemas, ...coreComponentSchemas };

export const outsideComponentTypes = Object.keys(outsideComponentSchemas).sort((a, b) => a.localeCompare(b));
