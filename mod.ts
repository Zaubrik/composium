// deno-lint-ignore-file no-unsafe-finally no-cond-assign
import { compose, composeSync } from "./composition.ts";
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
 * You can optionally extend the default `Context` object or pass a `State` type.
 * ```ts
 * export class Ctx extends Context<{ start: number }> {
 *   pathname = this.url.pathname;
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
  url: URL;
  constructor(request: Request, connInfo: ConnInfo, state?: S) {
    this.connInfo = connInfo;
    this.request = request;
    this.state = state || {} as S;
    this.url = new URL(request.url);
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
 * A curried function which takes a `Context` class, `mainHandlers`,
 * `catchHandlers` and `finallyHandlers` and returns in the end a `Handler`
 * function which can be passed to the function `listen`. You can pass an initial
 * `state` and it handles the request's method `HEAD` appropriately by default.
 * ```ts
 * createHandler(Ctx)(mainHandler)(catchHandler)(finallyHandler)
 * ```
 */
export function createHandler<C extends Context, S>(
  Context: new (request: Request, connInfo: ConnInfo, state?: S) => C,
  { state, isHandlingHead = true }: { state?: S; isHandlingHead?: boolean } =
    {},
) {
  return (...mainHandler: CtxHandler<C>[]) =>
    (...catchHandler: CtxHandler<C>[]) =>
      (...finallyHandler: CtxHandler<C>[]) =>
        async (request: Request, connInfo: ConnInfo): Promise<Response> => {
          const enabledHead = isHandlingHead && request.method === "HEAD";
          const ctx = new Context(
            enabledHead ? new Request(request, { method: "GET" }) : request,
            connInfo,
            state,
          );
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
            return enabledHead
              ? new Response(null, ctx.response)
              : ctx.response;
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
