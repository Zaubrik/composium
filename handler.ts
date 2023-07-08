import { compose } from "./composition.ts";
import { type Middleware } from "./route.ts";
import { type Context } from "./context.ts";

export type ServerHandlerOptions<S> = {
  state?: S;
  enableXResponseTimeHeader?: boolean;
  enableLogger?: boolean;
};

function setXResponseTimeHeader<C extends Context>(ctx: C) {
  const ms = Date.now() - ctx.startTime;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
}

function log<C extends Context>(ctx: C) {
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(
    `${ctx.request.method} ${ctx.request.url} [${ctx.response.status}] - ${rt}`,
  );
  if (ctx.error) console.log(ctx.error);
}

export function assertError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error("[non-error thrown]");
}

/**
 * A curried function which takes a `Context` class, `tryMiddlewares`,
 * `catchMiddlewares` and `finallyMiddlewares` and returns a `Deno.ServeHandler`
 * which can be passed to `Deno.serve`. It also handles the HTTP method
 * `HEAD` appropriately, sets the `X-Response-Time` header and logs to the
 * console by default. Optionally, you can pass an initial `state` object.
 * ```ts
 * const handler = createHandler(Ctx)(tryMiddlewares)(catchMiddlewares)(finallyMiddlewares)
 * Deno.serve(handler);
 * ```
 */
export function createHandler<C extends Context, S>(
  Context: new (
    request: Request,
    connInfo: Deno.ServeHandlerInfo,
    state?: S,
  ) => C,
  {
    state,
    enableXResponseTimeHeader = true,
    enableLogger = false,
  }: ServerHandlerOptions<S> = {},
) {
  return (...tryMiddlewares: Middleware<C>[]) =>
  (...catchMiddlewares: Middleware<C>[]) =>
  (...finallyMiddlewares: Middleware<C>[]): Deno.ServeHandler =>
  async (
    request: Request,
    connInfo: Deno.ServeHandlerInfo,
  ): Promise<Response> => {
    const ctx = new Context(request, connInfo, state);
    try {
      ctx.startTime = Date.now();
      await (compose(...tryMiddlewares)(ctx));
    } catch (caught) {
      ctx.error = assertError(caught);
      await (compose(...catchMiddlewares)(ctx));
    } finally {
      await (compose(...finallyMiddlewares)(ctx));
      if (enableXResponseTimeHeader) setXResponseTimeHeader(ctx);
      if (enableLogger) log(ctx);
    }
    return request.method === "HEAD"
      ? new Response(null, ctx.response)
      : ctx.response;
  };
}
