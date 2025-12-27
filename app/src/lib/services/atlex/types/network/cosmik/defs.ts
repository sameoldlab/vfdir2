import type {} from "@atcute/lexicons";
import * as v from "@atcute/lexicons/validations";

const _identifierSchema = /*#__PURE__*/ v.object({
  $type: /*#__PURE__*/ v.optional(
    /*#__PURE__*/ v.literal("network.cosmik.defs#identifier"),
  ),
  /**
   * The type of identifier (e.g., 'doi', 'at-uri', 'isbn').
   */
  type: /*#__PURE__*/ v.string(),
  /**
   * The identifier value.
   */
  value: /*#__PURE__*/ v.string(),
});

type identifier$schematype = typeof _identifierSchema;

export interface identifierSchema extends identifier$schematype {}

export const identifierSchema = _identifierSchema as identifierSchema;

export interface Identifier extends v.InferInput<typeof identifierSchema> {}
