import { createRoute, type Middleware } from "./route.ts";
import { createHandler } from "./handler.ts";
import { Context } from "./context.ts";

export { Context } from "./context.ts";
export { createRoute, type Method, type Middleware } from "./route.ts";
export { assertError, createHandler, type HandlerOptions } from "./handler.ts";
export { compose, composeSync } from "./composition.ts";

/**
 * Takes a `Middleware` and returns a `Deno.ServeHandler`.
 * ```ts
 * const handler = createDefaultHandler(tryMiddlewares)
 * Deno.serve(handler);
 * ```
 */
export function createDefaultHandler(
  ...tryMiddlewares: Middleware<Context>[]
) {
  return createHandler(Context, { enableLogger: true })(
    ...tryMiddlewares,
  )()();
}

export const createAllRoute = createRoute("ALL");
export const createConnectRoute = createRoute("CONNECT");
export const createDeleteRoute = createRoute("DELETE");
export const createGetRoute = createRoute("GET");
export const createHeadRoute = createRoute("HEAD");
export const createOptionsRoute = createRoute("OPTIONS");
export const createPatchRoute = createRoute("PATCH");
export const createPostRoute = createRoute("POST");
export const createPutRoute = createRoute("PUT");
export const createTraceRoute = createRoute("TRACE");

export const routes = {
  all: createAllRoute,
  connect: createConnectRoute,
  delete: createDeleteRoute,
  get: createGetRoute,
  head: createHeadRoute,
  options: createOptionsRoute,
  patch: createPatchRoute,
  post: createPostRoute,
  put: createPutRoute,
  trace: createTraceRoute,
};
