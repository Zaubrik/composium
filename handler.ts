import { type ConnInfo, type Handler } from "./deps.ts";
import { compose } from "./composition.ts";
import { Middleware } from "./route.ts";
import { Context } from "./context.ts";

function setXResponseTimeHeader<C extends Context>(ctx: C, startTime: number) {
  const ms = Date.now() - startTime;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
}

function assertError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error("[non-error thrown]");
}

/**
 * A curried function which takes a `Context` class, `tryMiddlewares`,
 * `catchMiddlewares` and `finallyMiddlewares` and returns in the end a `Handler`
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
      if (enableXResponseTimeHeader) setXResponseTimeHeader(ctx, startTime);
    }
    return request.method === "HEAD"
      ? new Response(null, ctx.response)
      : ctx.response;
  };
}

export type { Handler };
