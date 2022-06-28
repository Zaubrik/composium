// deno-lint-ignore-file no-unsafe-finally no-cond-assign
import { composeAsync } from "./util.ts";
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

/** The extendable `Context` is passed as only argument to your `CtxHandler`s. */
export class Context {
  error: Error | null = null;
  params: URLPatternResult = {} as URLPatternResult;
  response: Response = new Response("Not Found", { status: 404 });
  constructor(readonly request: Request, readonly connInfo: ConnInfo) {
  }
}

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
            return await (composeAsync(...handlers) as CtxHandler<C>)(ctx);
          }
        }
        return ctx;
      };
  };
}

export function createHandler<C extends Context>(
  contextClass: new (request: Request, connInfo: ConnInfo) => C,
) {
  return (...normalHandler: CtxHandler<C>[]) =>
    (...catchHandler: CtxHandler<C>[]) =>
      (...finallyHandler: CtxHandler<C>[]) =>
        async (request: Request, connInfo: ConnInfo): Promise<Response> => {
          const ctx = new contextClass(request, connInfo);
          try {
            await (composeAsync(...normalHandler)(ctx));
          } catch (caught) {
            if (caught instanceof Response) {
              ctx.response = caught;
            } else {
              ctx.error = caught instanceof Error
                ? caught
                : new Error("[non-error thrown]");
              await (composeAsync(...catchHandler)(ctx));
            }
          } finally {
            await (composeAsync(...finallyHandler)(ctx));
            return ctx.response;
          }
        };
}

export function listen(options: ServeInit | ServeTlsInit) {
  return async (handler: Handler) => {
    return "certFile" in options || "keyFile" in options
      ? await serveTls(handler, options)
      : await serve(handler, options);
  };
}

export { composeAsync };
