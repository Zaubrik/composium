import { compose } from "./composition.ts";
import { type Context } from "./context.ts";

export type Middleware<C extends Context> = (ctx: C) => C | Promise<C>;
export type Method =
  | "ALL"
  | "CONNECT"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT"
  | "TRACE";

/**
 * A curried function which takes HTTP `Method`s, a `URLPatternInput` and
 * `Middleware`s and returns in the end a composed route function.
 * ```ts
 * createRoute("GET")({ pathname: "*" })(middleware)
 * ```
 */
export function createRoute(...methods: Method[]) {
  return (urlPatternInput: URLPatternInput) => {
    const urlPattern = new URLPattern(urlPatternInput);
    return <C extends Context>(...middlewares: Middleware<C>[]) =>
    async (ctx: C): Promise<C> => {
      if (
        methods.includes("ALL") ||
        methods.includes(ctx.request.method as Method) ||
        (ctx.request.method === "HEAD" && methods.includes("GET"))
      ) {
        const urlPatternResult = urlPattern.exec(ctx.url);
        if (urlPatternResult) {
          ctx.result = urlPatternResult;
          return await (compose<C | Promise<C>>(...middlewares))(ctx);
        }
      }
      return ctx;
    };
  };
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
