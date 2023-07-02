import { Context, createHandler } from "./mod.ts";
import {
  connInfo,
  subtract5DelayedMiddleware,
  tryMiddleware,
} from "./test_util.ts";
import { assertEquals } from "./test_deps.ts";

type State = { result: number };

const request = new Request("https:example.com/books");

class Ctx extends Context<State> {}

function catchMiddleware(ctx: Ctx) {
  ctx.state.result = 1;
  return ctx;
}

function finallyMiddleware(ctx: Ctx) {
  ctx.response = new Response(ctx.state.result.toString());
  return ctx;
}

function throwMiddleware(_ctx: Ctx): never {
  throw new Error("uups");
}

Deno.test("createHandler", async function () {
  assertEquals(
    await (await createHandler(Ctx, { state: { result: 10 } })(tryMiddleware)(
      subtract5DelayedMiddleware,
    )(finallyMiddleware)(
      request,
      connInfo,
    )).text(),
    "28",
  );
  assertEquals(
    await (await createHandler(Ctx, { state: { result: 10 } })(
      tryMiddleware,
      throwMiddleware,
    )(
      catchMiddleware,
    )(
      finallyMiddleware,
    )(
      request,
      connInfo,
    )).text(),
    "1",
  );
});
