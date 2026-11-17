import { createAjv } from '@jsonforms/core';
import type { JsonSchema } from '@jsonforms/core';
import type { ErrorObject, ValidateFunction } from 'ajv';
import schema from './viewer.schema.json';

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

/** Returns the viewer schema with each component schema put under the config_json of its type. */
export function getViewerConfigSchema(componentSchemas: Record<string, JsonSchema> = {}): JsonSchema {
  const merged = JSON.parse(JSON.stringify(viewerConfigSchema));
  const types = Object.keys(componentSchemas);
  if (!types.length) return merged;
  merged.definitions.component.allOf = types.map(type => ({
    if: { properties: { type: { const: type } }, required: ['type'] },
    then: { properties: { config_json: componentSchemas[type] } }
  }));
  return merged;
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

/** Validates a viewer config against the viewer schema, or the given one, and lists every fault. */
export function validateViewerConfig(config: unknown, target: JsonSchema = viewerConfigSchema): ViewerConfigValidation {
  const validate = getValidator(target);
  const valid = validate(config) as boolean;
  const faults = (validate.errors || []).filter(e => e.keyword !== 'if').map(toFault);
  return { valid, faults };
}
