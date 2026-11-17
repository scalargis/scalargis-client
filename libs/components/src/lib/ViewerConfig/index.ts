import { createAjv } from '@jsonforms/core';
import type { JsonSchema } from '@jsonforms/core';
import type { ErrorObject, ValidateFunction } from 'ajv';
import schema from './viewer.schema.json';
import { coreComponentSchemas } from './coreComponentSchemas';

export { coreComponentSchemas };

/** A schema fault at one JSON pointer of the viewer config. */
export interface ViewerConfigFault {
  pointer: string;
  keyword: string;
  message: string;
  params: Record<string, unknown>;
}

/** The result of one viewer config validation. */
export interface ViewerConfigValidation {
  valid: boolean;
  faults: ViewerConfigFault[];
}

export const viewerConfigSchema = schema as unknown as JsonSchema;

const ajv = createAjv({ allErrors: true });
const validators = new WeakMap<object, ValidateFunction>();

/** Returns the viewer schema with each component schema, by default the core ones, put under the config_json of its type. */
export function getViewerConfigSchema(componentSchemas: Record<string, JsonSchema> = coreComponentSchemas): JsonSchema {
  const merged = JSON.parse(JSON.stringify(viewerConfigSchema));
  const types = Object.keys(componentSchemas);
  if (!types.length) return merged;
  merged.definitions.component.allOf = types.map(type => ({
    if: { properties: { type: { const: type } }, required: ['type'] },
    then: { properties: { config_json: withoutSchemaKeyword(componentSchemas[type]) } }
  }));
  return merged;
}

/** Returns a copy of a component schema without its root $schema keyword. */
function withoutSchemaKeyword(componentSchema: JsonSchema): JsonSchema {
  const copy = JSON.parse(JSON.stringify(componentSchema));
  delete copy.$schema;
  return copy;
}

let fullSchema: JsonSchema | undefined;

/** Returns the viewer schema with the core component schemas, built once. */
function getFullSchema(): JsonSchema {
  if (!fullSchema) fullSchema = getViewerConfigSchema();
  return fullSchema;
}

/** Returns the compiled validator of a schema, compiled once. */
function getValidator(target: JsonSchema): ValidateFunction {
  let validate = validators.get(target);
  if (!validate) {
    validate = ajv.compile(target);
    validators.set(target, validate);
  }
  return validate;
}

/** Maps one ajv error to a fault. */
function toFault(error: ErrorObject): ViewerConfigFault {
  return {
    pointer: error.instancePath,
    keyword: error.keyword,
    message: error.message || error.keyword,
    params: error.params as Record<string, unknown>
  };
}

/** Validates a viewer config against the viewer schema with the core component schemas, or the given one, and lists every fault. */
export function validateViewerConfig(config: unknown, target?: JsonSchema): ViewerConfigValidation {
  const validate = getValidator(target || getFullSchema());
  const valid = validate(config) as boolean;
  const faults = (validate.errors || []).filter(e => e.keyword !== 'if').map(toFault);
  return { valid, faults };
}
