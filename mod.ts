// deno-lint-ignore-file no-unsafe-finally no-cond-assign
import { compose, composeSync } from "./util.ts";
import {
  ConnInfo,
  Handler,
  serve,
  ServeInit,
  serveTls,
  ServeTlsInit,
} from "./deps.ts";

type CtxHandler<C extends Context> = (ctx: C) => C | Promise<C>;
type Method =
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
/** Any object can be assigned to the property `state` of the `Context` object. */
type State = Record<string | number | symbol, unknown>;
// deno-lint-ignore no-explicit-any
type DefaultState = Record<string, any>;

/**
 * The extendable `Context` is passed as only argument to your `CtxHandler`s.
 * You can optionally extend the default `Context` object.
 * ```ts
 * class Ctx extends Context {
 *   url = new URL(this.request.url);
 *   state: any = {};
 * }
 * ```
 */
export class Context<S extends State = DefaultState> {
  connInfo: ConnInfo;
  error: Error | null = null;
  params: URLPatternResult = {} as URLPatternResult;
  request: Request;
  response: Response = new Response("Not Found", { status: 404 });
  state: S;
  constructor(request: Request, connInfo: ConnInfo, state?: S) {
    this.request = request;
    this.connInfo = connInfo;
    this.state = state || {} as S;
  }
}

/**
 * A curried function which takes HTTP `Method`s, a `URLPatternInput` and
 * `CtxHandler`s and returns in the end a composed route function.
 * ```ts
 * createRoute("GET")({ pathname: "*" })(ctxHandler)
 * ```
 */
export function createRoute(...methods: Method[]) {
  return (urlPatternInput: URLPatternInput) => {
    const urlPattern = new URLPattern(urlPatternInput);
    return <C extends Context>(...handlers: CtxHandler<C>[]) =>
      async (ctx: C): Promise<C> => {
        if (
          methods.includes("ALL") ||
          methods.includes(ctx.request.method as Method)
        ) {
          if (ctx.params = urlPattern.exec(ctx.request.url)!) {
            return await (compose<C | Promise<C>>(...handlers))(ctx);
          }
        }
        return ctx;
      };
  };
}

/**
 * A curried function which takes `Context` class, `mainHandlers`, `catchHandlers`
 * and `finallyHandlers` and returns in the end a `Handler` which can be passed
 * to `listen`.
 * ```ts
 * createHandler(Ctx)(routeGet)(catchHandler)(finallyHandler)
 * ```
 */
export function createHandler<C extends Context, S>(
  contextClass: new (request: Request, connInfo: ConnInfo, state?: S) => C,
  state?: S,
) {
  return (...mainHandler: CtxHandler<C>[]) =>
    (...catchHandler: CtxHandler<C>[]) =>
      (...finallyHandler: CtxHandler<C>[]) =>
        async (request: Request, connInfo: ConnInfo): Promise<Response> => {
          const ctx = new contextClass(request, connInfo, state);
          try {
            await (compose(...mainHandler)(ctx));
          } catch (caught) {
            if (caught instanceof Response) {
              ctx.response = caught;
            } else {
              ctx.error = caught instanceof Error
                ? caught
                : new Error("[non-error thrown]");
              await (compose(...catchHandler)(ctx));
            }
          } finally {
            await (compose(...finallyHandler)(ctx));
            return ctx.response;
          }
        };
}

/**
 * A curried function which constructs a server, creates a listener on the given
 * address, accepts incoming connections, upgrades them to TLS, and handles
 * requests.
 * ```ts
 * await app.listen({ port: 8080 })(handler)
 * ```
 */
export function listen(options: ServeInit | ServeTlsInit) {
  return async (handler: Handler) => {
    return "certFile" in options || "keyFile" in options
      ? await serveTls(handler, options)
      : await serve(handler, options);
  };
}

export { compose, composeSync };
