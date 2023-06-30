import {
  type Handler,
  serve,
  type ServeInit,
  serveTls,
  type ServeTlsInit,
} from "./deps.ts";

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
