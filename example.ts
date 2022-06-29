// deno-lint-ignore-file
import { compose, Context, createHandler, createRoute, listen } from "./mod.ts";

// You can optionally extend the default `Context` object.
class Ctx extends Context {
  url = new URL(this.request.url);
  state: any = {};
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

const routeGet = createRoute("GET");
const routeAllAndEverything = createRoute("ALL")({ pathname: "*" });
const routePrivate = createRoute("DELETE", "POST")({ pathname: "/private/*" });
const getSubdomain = routeGet({
  hostname: `{:subdomain.}+localhost`,
  pathname: "*",
});

const greetOrWelcome = compose(welcome, greet);

const handleDate = routeAllAndEverything(date);
const handleVerify = routePrivate(verify);
const handleWelcome = routeGet({ pathname: "/{:name}?" })(greetOrWelcome);
const handleSubdomain = getSubdomain(sub);

const mainHandler = compose(
  handleSubdomain,
  handleWelcome,
  handleVerify,
  handleDate,
) as any; // WTF
const catchHandler = routeAllAndEverything(fix);
const finallyHandler = routeAllAndEverything(log, setHeader);

const handler = createHandler(Ctx)(mainHandler)(catchHandler)(finallyHandler);

await listen({ port: 8080 })(handler);
