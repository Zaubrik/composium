// deno-lint-ignore-file
import { compose, composeSync } from "./composition.ts";
import { assertEquals, delay } from "./test_deps.ts";
import {
  add10,
  divide5Delayed,
  multiply10,
  subtract5Delayed,
} from "./test_util.ts";

Deno.test("compose", async function () {
  assertEquals(await compose(add10)(10), 20);
  assertEquals(await compose(add10, multiply10)(10), 110);
  assertEquals(await compose(add10, multiply10, subtract5Delayed)(10), 10);
  assertEquals(
    await compose(
      add10,
      subtract5Delayed,
      multiply10,
      divide5Delayed,
      add10,
      add10,
    )(10),
    60,
  );
});

Deno.test("composeSync", async function () {
  assertEquals(await composeSync(add10)(10), 20);
  assertEquals(await composeSync(add10, multiply10)(10), 110);
  assertEquals(await composeSync(add10, multiply10, add10)(10), 210);
});
