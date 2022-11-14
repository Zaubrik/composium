import { Context, createHandler, createRoute, listen } from "../mod.ts";
import { serveDir } from "https://deno.land/std@0.164.0/http/file_server.ts";
import { fromFileUrl } from "https://deno.land/std@0.164.0/path/mod.ts";

function identity<X>(x: X) {
  return x;
}

async function serveStatic(ctx: Context) {
  ctx.response = await serveDir(ctx.request, {
    showDirListing: true,
    fsRoot: fromFileUrl(import.meta.resolve("./")),
  });
  return ctx;
}

const mainHandler = createRoute("GET")({ pathname: "*" })(serveStatic);
const handler = createHandler(Context)(mainHandler)(identity)(identity);

await listen(handler)({ port: 8080 });
