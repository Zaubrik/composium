import { delay } from "./test_deps.ts";

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
