# composium

Powered by
[functional composition](https://en.wikipedia.org/wiki/Function_composition) and
the
[URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API),
`composium` has become the most flexible routing framework in the world. Through
its composability it can serve perfectly as a _generic_, _abstract_ and
_minimal_ layer for **your own back-end framework**.

## URL Pattern

The best way to learn and test the URL Pattern API is Zaubrik's free
[URL Pattern User Interface](https://dev.zaubrik.com/url-pattern).

## Documentation

```bash
deno doc https://deno.land/x/composium/mod.ts
```

## Example

```ts
import {
  compose,
  Context,
  createHandler,
  createRoute,
  listen,
} from "https://deno.land/x/composium/mod.ts";

// You can optionally extend the default `Context` object or pass a `State` type.
export class Ctx extends Context<{ start: number }> {
  pathname = this.url.pathname;
}

function date(ctx: Ctx) {
  ctx.state.start = Date.now();
  return ctx;
}

function verify(ctx: Ctx) {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");
  return ctx;
}

function greet(ctx: Ctx) {
  ctx.response = new Response(`Hello World!`);
  return ctx;
}

function welcome(ctx: Ctx) {
  const name = ctx.params.pathname.groups.name;
  if (name) ctx.response = new Response(`Welcome, ${name}!`);
  return ctx;
}

function sub(ctx: Ctx) {
  ctx.response = new Response(
    `What's up ${ctx.params.hostname.groups.subdomain}?`,
  );
  return ctx;
}

function fix(ctx: Ctx) {
  console.error(ctx.error?.message);
  ctx.response = new Response("Unauthorized", { status: 401 });
  return ctx;
}

function setHeader(ctx: Ctx) {
  const ms = Date.now() - ctx.state.start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  return ctx;
}

function log(ctx: Ctx) {
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.url.pathname} - ${String(rt)}`);
  return ctx;
}

// This is just a showcase. You can compose all of it to much fewer lines of code.
const routeGet = createRoute("GET");
const routeAllAndEverything = createRoute("ALL")({ pathname: "*" });
const routePrivate = createRoute("DELETE", "POST")({ pathname: "/private/*" });

const greetOrWelcome = compose(welcome, greet);

const getSubdomain = routeGet({
  hostname: `{:subdomain.}+localhost`,
  pathname: "*",
});
const handleWelcome = routeGet({ pathname: "/{:name}?" })(greetOrWelcome);
const handleDate = routeAllAndEverything(date);
const handleVerify = routePrivate(verify);
const handleSubdomain = getSubdomain(sub);

const mainHandler = compose(
  handleSubdomain,
  handleWelcome,
  handleVerify,
  handleDate,
) as any; // TS WTF!
const catchHandler = routeAllAndEverything(fix);
const finallyHandler = routeAllAndEverything(log, setHeader);

const handler = createHandler(Ctx)(mainHandler)(catchHandler)(finallyHandler);

await listen({ port: 8080 })(handler);
```

## Dependency

The `http` module from Deno's `std` library.
