import { type ConnInfo, type Handler } from "./deps.ts";
import { compose } from "./composition.ts";
import { type Middleware } from "./route.ts";
import { type Context } from "./context.ts";

export type HandlerOptions<S> = {
  state?: S;
  enableXResponseTimeHeader?: boolean;
  enableDefaultLogger?: boolean;
  startTime?: number;
};

function setXResponseTimeHeader<C extends Context>(ctx: C, startTime: number) {
  const ms = Date.now() - startTime;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
}

function log<C extends Context>(ctx: C) {
  console.log(
    `${ctx.request.method} ${ctx.request.url} [${ctx.response.status}]`,
  );
  if (ctx.error) console.log(ctx.error);
}

export function assertError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error("[non-error thrown]");
}

/**
 * A curried function which takes a `Context` class, `tryMiddlewares`,
 * `catchMiddlewares` and `finallyMiddlewares` and returns in the end a `Handler`
 * function which can be passed to `listen`. It also handles the HTTP method
 * `HEAD` appropriately, sets the `X-Response-Time` header and logs to the
 * console by default. Optionally you can pass an initial `state` object.
 * ```ts
 * createHandler(Ctx)(tryMiddlewares)(catchMiddlewares)(finallyMiddlewares)
 * ```
 */
export function createHandler<C extends Context, S>(
  Context: new (request: Request, connInfo: ConnInfo, state?: S) => C,
  {
    state,
    enableXResponseTimeHeader = true,
    enableDefaultLogger = true,
    startTime = NaN,
  }: HandlerOptions<S> = {},
) {
  return (...tryMiddlewares: Middleware<C>[]) =>
  (...catchMiddlewares: Middleware<C>[]) =>
  (...finallyMiddlewares: Middleware<C>[]): Handler =>
  async (request: Request, connInfo: ConnInfo): Promise<Response> => {
    const ctx = new Context(request, connInfo, state);
    try {
      if (enableXResponseTimeHeader) startTime = Date.now();
      await (compose(...tryMiddlewares)(ctx));
    } catch (caught) {
      ctx.error = assertError(caught);
      await (compose(...catchMiddlewares)(ctx));
    } finally {
      await (compose(...finallyMiddlewares)(ctx));
      if (enableDefaultLogger) log(ctx);
      if (enableXResponseTimeHeader) setXResponseTimeHeader(ctx, startTime);
    }
    return request.method === "HEAD"
      ? new Response(null, ctx.response)
      : ctx.response;
  };
}

export type { Handler };
