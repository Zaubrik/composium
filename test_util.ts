// deno-lint-ignore-file
import { delay } from "./test_deps.ts";
import { compose, type Context } from "./mod.ts";

export const connInfo = {
  localAddr: { transport: "tcp" as const, hostname: "127.0.0.1", port: 8080 },
  remoteAddr: { transport: "tcp" as const, hostname: "127.0.0.1", port: 48951 },
};

function createMiddleware(f: (...args: any[]) => any | Promise<any>) {
  return async <C extends Context>(ctx: C) => {
    ctx.state.result = await f(ctx.state.result);
    return ctx;
  };
}

export function add10(n: number) {
  return n + 10;
}

export function multiply10(n: number) {
  return n * 10;
}

export async function subtract5Delayed(n: number) {
  await delay(10);
  return n - 10;
}

export async function divide5Delayed(n: number) {
  await delay(10);
  return n / 5;
}

export const add10Middleware = createMiddleware(add10);
export const multiplyMiddleware = createMiddleware(multiply10);
export const subtract5DelayedMiddleware = createMiddleware(subtract5Delayed);
export const divide5DelayedMiddleware = createMiddleware(divide5Delayed);

export const mainMiddleware = compose(
  add10Middleware,
  divide5DelayedMiddleware,
  subtract5DelayedMiddleware,
  multiplyMiddleware,
) as any;
