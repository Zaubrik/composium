// deno-lint-ignore-file
// https://stackoverflow.com/questions/70050001/javascript-how-to-compose-asynchronous-functions
const compose2 = (f: any, g: any) =>
  async (...args: any) => f(await g(...args));

// https://github.com/reduxjs/redux/blob/master/src/compose.ts
type Func<T extends any[], R> = (...a: T) => R;

function compose1(): <R>(a: R) => R;

function compose1<F extends Function>(f: F): F;

/* two functions */
function compose1<A, T extends any[], R>(
  f1: (a: A) => R,
  f2: Func<T, A>,
): Func<T, R>;

/* three functions */
function compose1<A, B, T extends any[], R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func<T, A>,
): Func<T, R>;

/* four functions */
function compose1<A, B, C, T extends any[], R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func<T, A>,
): Func<T, R>;

/* rest */
function compose1<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R;

function compose1<R>(...funcs: Function[]): (...args: any[]) => R;

function compose1(...funcs: Function[]) {
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  // NOTE: Allow 'async' functions.
  return funcs.reduce(compose2);
}

function composeSync1(): <R>(a: R) => R;

function composeSync1<F extends Function>(f: F): F;

/* two functions */
function composeSync1<A, T extends any[], R>(
  f1: (a: A) => R,
  f2: Func<T, A>,
): Func<T, R>;

/* three functions */
function composeSync1<A, B, T extends any[], R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func<T, A>,
): Func<T, R>;

/* four functions */
function composeSync1<A, B, C, T extends any[], R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func<T, A>,
): Func<T, R>;

/* rest */
function composeSync1<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R;

function composeSync1<R>(...funcs: Function[]): (...args: any[]) => R;

function composeSync1(...funcs: Function[]) {
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args: any) => a(b(...args)));
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for the
 * resulting composite function. It accepts sync and async functions.
 *
 * @param funcs The sync and async functions to compose.
 * @returns A function obtained by composing the argument functions from right
 *   to left. For example, `compose(f, g, h)` is identical to doing
 *   `(...args) => f(g(h(...args)))`.
 */
export const compose = compose1; // Needs renaming for `deno doc`

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for the
 * resulting composite function. The function `composeSync` doesn't accept async
 * functions but composes non-async functions faster than `compose` does.
 *
 * @param funcs The sync functions to compose.
 * @returns A function obtained by composing the argument functions from right
 *   to left. For example, `compose(f, g, h)` is identical to doing
 *   `(...args) => f(g(h(...args)))`.
 */
export const composeSync = composeSync1; // Needs renaming for `deno doc`
