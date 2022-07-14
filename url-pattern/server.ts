import { Context, createHandler, createRoute, listen } from "../mod.ts";
import { serveDir } from "https://deno.land/std@0.148.0/http/file_server.ts";

function identity<X>(x: X) {
  return x;
}

async function serveStatic(ctx: Context) {
  ctx.response = await serveDir(ctx.request, {
    showDirListing: true,
    fsRoot: new URL("./", import.meta.url).pathname,
  });
  return ctx;
}

const mainHandler = createRoute("GET")({ pathname: "*" })(serveStatic);
const handler = createHandler(Context)(mainHandler)(identity)(identity);

await listen({ port: 8080 })(handler);
