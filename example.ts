import { compose, Context, createHandler, createRoute } from "./mod.ts";

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
  const name = ctx.result.pathname.groups.name;
  if (name) ctx.response = new Response(`Welcome, ${name}!`);
  return ctx;
}

function sub(ctx: Ctx) {
  ctx.response = new Response(
    `What's up ${ctx.result.hostname.groups.subdomain}?`,
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
  console.log(
    `${ctx.request.method} ${ctx.request.url} [${ctx.response.status}] - ${
      String(rt)
    }`,
  );
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

const tryMiddleware = compose(
  handleSubdomain,
  handleWelcome,
  handleVerify,
  handleDate,
  // deno-lint-ignore no-explicit-any
) as any; // TS WTF!
const catchMiddleware = routeAllAndEverything(fix);
const finallyMiddleware = routeAllAndEverything(log, setHeader);

const handler = createHandler(Ctx)(tryMiddleware)(catchMiddleware)(
  finallyMiddleware,
);

Deno.serve(handler);
