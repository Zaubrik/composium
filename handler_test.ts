import { Context, createHandler } from "./mod.ts";
import {
  connInfo,
  mainMiddleware,
  subtract5DelayedMiddleware,
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
    await (await createHandler(
      subtract5DelayedMiddleware,
    )(finallyMiddleware)(Ctx, { state: { result: 10 } })(mainMiddleware)(
      request,
      connInfo,
    )).text(),
    "28",
  );
  assertEquals(
    await (await createHandler(
      catchMiddleware,
    )(
      finallyMiddleware,
    )(Ctx, { state: { result: 10 } })(mainMiddleware, throwMiddleware)(
      request,
      connInfo,
    )).text(),
    "1",
  );
});
