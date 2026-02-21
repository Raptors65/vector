/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyses from "../analyses.js";
import type * as analysis from "../analysis.js";
import type * as customers from "../customers.js";
import type * as marketEvidence from "../marketEvidence.js";
import type * as seed from "../seed.js";
import type * as signals from "../signals.js";
import type * as upload from "../upload.js";
import type * as usageMetrics from "../usageMetrics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyses: typeof analyses;
  analysis: typeof analysis;
  customers: typeof customers;
  marketEvidence: typeof marketEvidence;
  seed: typeof seed;
  signals: typeof signals;
  upload: typeof upload;
  usageMetrics: typeof usageMetrics;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
