import { composeAsync } from "./util.ts";
import { assertEquals, delay } from "./test_deps.ts";

function add10(n: number) {
  return n + 10;
}

function times10(n: number) {
  return n * 10;
}

async function subtract10Delayed(n: number) {
  await delay(10);
  return n - 10;
}

Deno.test("overview", async function () {
  assertEquals(await composeAsync(add10)(10), 20);
  assertEquals(await composeAsync(add10, times10)(10), 110);
  assertEquals(await composeAsync(add10, times10, subtract10Delayed)(10), 10);
});
