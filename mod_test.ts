import { compose, Context, createHandler, createRoute } from "./mod.ts";
import {
  add10,
  divide5Delayed,
  multiply10,
  subtract5Delayed,
} from "./test_util.ts";
import { assertEquals } from "./test_deps.ts";

type State = { result: number };

const request = new Request("https:example.com/books");
const connInfo = {
  localAddr: { transport: "tcp" as const, hostname: "127.0.0.1", port: 8080 },
  remoteAddr: { transport: "tcp" as const, hostname: "127.0.0.1", port: 48951 },
};

const add10Handler = createCtxHandler(add10);
const multiplyHandler = createCtxHandler(multiply10);
const subtract5DelayedHandler = createCtxHandler(subtract5Delayed);
const divide5DelayedHandler = createCtxHandler(divide5Delayed);

const mainHandler = compose(
  add10Handler,
  divide5DelayedHandler,
  subtract5DelayedHandler,
  multiplyHandler,
) as any;

class Ctx extends Context<State> {}

function createCtxHandler(f: (...args: any[]) => any | Promise<any>) {
  return async <C extends Context>(ctx: C) => {
    ctx.state.result = await f(ctx.state.result);
    return ctx;
  };
}

function catchHandler(ctx: Ctx) {
  ctx.state.result = 1;
  return ctx;
}

function finallyHandler(ctx: Ctx) {
  ctx.response = new Response(ctx.state.result.toString());
  return ctx;
}

function throwHandler(ctx: Ctx) {
  throw new Error("uups");
  return ctx;
}

Deno.test("createRoute", async function () {
  assertEquals(
    (await createRoute("GET")({ pathname: "/books" })(add10Handler)(
      new Ctx(request, connInfo, { result: 10 }),
    )).state.result,
    20,
  );
  assertEquals(
    (await createRoute("GET")({ pathname: "/books" })(
      add10Handler,
      divide5DelayedHandler,
    )(
      new Ctx(request, connInfo, { result: 10 }),
    )).state.result,
    12,
  );
  assertEquals(
    (await createRoute("POST", "GET")({ pathname: "/books" })(mainHandler)(
      new Ctx(
        request,
        connInfo,
        { result: 10 },
      ),
    )).state.result,
    28,
  );
  assertEquals(
    (await createRoute("POST", "DELETE")({ pathname: "/books" })(mainHandler)(
      new Ctx(
        request,
        connInfo,
        { result: 10 },
      ),
    )).state.result,
    10,
  );
});

Deno.test("createHandler", async function () {
  assertEquals(
    await (await createHandler(Ctx, { result: 10 })(mainHandler)(
      subtract5DelayedHandler,
    )(
      finallyHandler,
    )(request, connInfo)).text(),
    "28",
  );
  assertEquals(
    await (await createHandler(Ctx, { result: 10 })(mainHandler, throwHandler)(
      catchHandler,
    )(
      finallyHandler,
    )(request, connInfo)).text(),
    "1",
  );
});
