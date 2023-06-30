import { type ConnInfo } from "./deps.ts";

/** Any object can be assigned to the property `state` of the `Context` object. */
type State = Record<string | number | symbol, unknown>;
// deno-lint-ignore no-explicit-any
type DefaultState = Record<string, any>;

/**
 * An instance of the extendable `Context` is passed as only argument to your
 * `Middleware`s. You can optionally extend the default `Context` object or pass
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
