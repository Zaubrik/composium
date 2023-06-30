import { compose } from "./composition.ts";
import {
  ConnInfo,
  Handler,
  serve,
  ServeInit,
  serveTls,
  ServeTlsInit,
} from "./deps.ts";

type CtxHandler<C extends Context> = (ctx: C) => C | Promise<C>;
/** Any object can be assigned to the property `state` of the `Context` object. */
type State = Record<string | number | symbol, unknown>;
// deno-lint-ignore no-explicit-any
type DefaultState = Record<string, any>;
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
 * An instance of the extendable `Context` is passed as only argument to your
 * `CtxHandler`s. You can optionally extend the default `Context` object or pass
 * a `State` type.
 * ```ts
 * export class Ctx extends Context<{ start: number }> {
 *   pathname = this.url.pathname;
 * }
 * ```
 */
export class Context<S extends State = DefaultState> {
  connInfo: ConnInfo;
  error: Error | null = null;
  result: URLPatternResult = {} as URLPatternResult;
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
        methods.includes(ctx.request.method as Method) ||
        (ctx.request.method === "HEAD" && methods.includes("GET"))
      ) {
        const urlPatternResult = urlPattern.exec(ctx.url);
        if (urlPatternResult) {
          ctx.result = urlPatternResult;
          return await (compose<C | Promise<C>>(...handlers))(ctx);
        }
      }
      return ctx;
    };
  };
}

function setXResponseTimeHeader<C extends Context>(ctx: C, startTime: number) {
  const ms = Date.now() - startTime;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
}

function assertError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error("[non-error thrown]");
}

/**
 * A curried function which takes a `Context` class, `tryHandlers`,
 * `catchHandlers` and `finallyHandlers` and returns in the end a `Handler`
 * function which can be passed to `listen`. It also handles the HTTP method
 * `HEAD` appropriately and sets the `X-Response-Time` header. You can pass
 * an initial `state` object or disable the `X-Response-Time` header optionally.
 * ```ts
 * createHandler(Ctx)(tryHandler)(catchHandler)(finallyHandler)
 * ```
 */
export function createHandler<C extends Context, S>(
  Context: new (request: Request, connInfo: ConnInfo, state?: S) => C,
  { state, enableXResponseTimeHeader = true }: {
    state?: S;
    enableXResponseTimeHeader?: boolean;
  } = {},
) {
  let startTime = NaN;
  return (...tryHandlers: CtxHandler<C>[]) =>
  (...catchHandlers: CtxHandler<C>[]) =>
  (...finallyHandlers: CtxHandler<C>[]) =>
  async (request: Request, connInfo: ConnInfo): Promise<Response> => {
    const ctx = new Context(request, connInfo, state);
    try {
      if (enableXResponseTimeHeader) startTime = Date.now();
      await (compose(...tryHandlers)(ctx));
    } catch (caught) {
      ctx.error = assertError(caught);
      await (compose(...catchHandlers)(ctx));
    } finally {
      await (compose(...finallyHandlers)(ctx));
      if (enableXResponseTimeHeader) setXResponseTimeHeader(ctx, startTime);
    }
    return request.method === "HEAD"
      ? new Response(null, ctx.response)
      : ctx.response;
  };
}

/**
 * A curried function which takes a `Handler` and `options`. It constructs a
 * server, creates a listener on the given address, accepts incoming connections,
 * upgrades them to TLS and handles requests.
 * ```ts
 * await listen(handler)({ port: 8080 })
 * ```
 */
export function listen(handler: Handler) {
  return async (options: ServeInit | ServeTlsInit) => {
    return "certFile" in options || "keyFile" in options
      ? await serveTls(handler, options)
      : await serve(handler, options);
  };
}
