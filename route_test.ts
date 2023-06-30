import { Context, createRoute } from "./mod.ts";
import {
  add10Middleware,
  connInfo,
  divide5DelayedMiddleware,
  mainMiddleware,
} from "./test_util.ts";
import { assertEquals } from "./test_deps.ts";

type State = { result: number };

const request = new Request("https:example.com/books");

class Ctx extends Context<State> {}

Deno.test("createRoute", async function () {
  assertEquals(
    (await createRoute("ALL")({ pathname: "/books" })(add10Middleware)(
      new Ctx(request, connInfo, { result: 10 }),
    )).state.result,
    20,
  );
  assertEquals(
    (await createRoute("GET")({ pathname: "/books" })(
      add10Middleware,
      divide5DelayedMiddleware,
    )(
      new Ctx(request, connInfo, { result: 10 }),
    )).state.result,
    12,
  );
  assertEquals(
    (await createRoute("POST", "GET")({ pathname: "/books" })(mainMiddleware)(
      new Ctx(
        request,
        connInfo,
        { result: 10 },
      ),
    )).state.result,
    28,
  );
  assertEquals(
    (await createRoute("POST", "DELETE")({ pathname: "/books" })(
      mainMiddleware,
    )(
      new Ctx(
        request,
        connInfo,
        { result: 10 },
      ),
    )).state.result,
    10,
  );
  assertEquals(
    (await createRoute("GET")({ pathname: "/ups" })(mainMiddleware)(
      new Ctx(
        request,
        connInfo,
        { result: 10 },
      ),
    )).state.result,
    10,
  );
});
