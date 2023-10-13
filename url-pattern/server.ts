import { type Context, createDefaultHandler, createGetRoute } from "../mod.ts";
import { serveDir } from "https://deno.land/std@0.202.0/http/file_server.ts";
import { fromFileUrl } from "https://deno.land/std@0.202.0/path/mod.ts";

async function serveStatic(ctx: Context) {
  ctx.response = await serveDir(ctx.request, {
    showDirListing: true,
    fsRoot: fromFileUrl(import.meta.resolve("./")),
  });
  return ctx;
}

const mainMiddleware = createGetRoute({ pathname: "*" })(serveStatic);
const handler = createDefaultHandler(mainMiddleware);

Deno.serve(handler);
