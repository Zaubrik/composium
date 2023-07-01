import { createRoute } from "./route.ts";
import { createHandler } from "./handler.ts";
import { Context } from "./context.ts";

export { listen } from "./server.ts";
export { Context } from "./context.ts";
export { createRoute, type Method, type Middleware } from "./route.ts";
export {
  assertError,
  createHandler,
  type Handler,
  type HandlerOptions,
} from "./handler.ts";
export { compose, composeSync } from "./composition.ts";

export const createDefaultHandler = createHandler()()(Context);

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
