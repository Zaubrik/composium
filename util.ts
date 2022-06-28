// deno-lint-ignore-file
// https://stackoverflow.com/questions/70050001/javascript-how-to-compose-asynchronous-functions
const compose2 = (f: any, g: any) =>
  async (...args: any) => f(await g(...args));

// https://github.com/reduxjs/redux/blob/master/src/compose.ts
type Func<T extends any[], R> = (...a: T) => R;

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for the
 * resulting composite function.
 *
 * @param funcs The functions to compose.
 * @returns A function obtained by composing the argument functions from right
 *   to left. For example, `compose(f, g, h)` is identical to doing
 *   `(...args) => f(g(h(...args)))`.
 */
export function composeAsync(): <R>(a: R) => R;

export function composeAsync<F extends Function>(f: F): F;

/* two functions */
export function composeAsync<A, T extends any[], R>(
  f1: (a: A) => R,
  f2: Func<T, A>,
): Func<T, R>;

/* three functions */
export function composeAsync<A, B, T extends any[], R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func<T, A>,
): Func<T, R>;

/* four functions */
export function composeAsync<A, B, C, T extends any[], R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func<T, A>,
): Func<T, R>;

/* rest */
export function composeAsync<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R;

export function composeAsync<R>(...funcs: Function[]): (...args: any[]) => R;

export function composeAsync(...funcs: Function[]) {
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(compose2);
}
