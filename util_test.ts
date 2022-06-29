import { compose, composeSync } from "./util.ts";
import { assertEquals, delay } from "./test_deps.ts";

function add10(n: number) {
  return n + 10;
}

function times10(n: number) {
  return n * 10;
}

function divide5(n: number) {
  return n / 5;
}

async function subtract10Delayed(n: number) {
  await delay(10);
  return n - 10;
}

Deno.test("compose", async function () {
  assertEquals(await compose(add10)(10), 20);
  assertEquals(await compose(add10, times10)(10), 110);
  assertEquals(await compose(add10, times10, subtract10Delayed)(10), 10);
  assertEquals(
    await compose(add10, subtract10Delayed, times10, divide5, add10, add10)(10),
    60,
  );
});

Deno.test("composeSync", async function () {
  assertEquals(await composeSync(add10)(10), 20);
  assertEquals(await composeSync(add10, times10)(10), 110);
  assertEquals(await composeSync(add10, times10, divide5)(10), 30);
});
