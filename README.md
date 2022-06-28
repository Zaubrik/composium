# composium

Powered by
[functional composition](https://en.wikipedia.org/wiki/Function_composition) and
the
[URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API),
`composium` has become the simplest routing framework in the world.

## URL Pattern

The best way to learn and test the URL Pattern API is using our free
[URL Pattern User Interface](https://dev.zaubrik.com/urlpattern/).

## Example

```ts
import { compose, Context, createHandler, createRoute, listen } from "./mod.ts"

class Ctx extends Context {
  state: any = {}
  url = new URL(this.request.url)
}

function first(ctx: Ctx) {
  ctx.response = new Response("first")
  console.log("first")
  return ctx
}
function second(ctx: Ctx) {
  ctx.response = new Response("second")
  console.log("second")
  // throw new Error("uups");
  return ctx
}
function third(ctx: Ctx) {
  ctx.response = new Response("third")
  console.log("third")
  return ctx
}
async function catchIt(ctx: Ctx) {
  console.log("caught")
  return ctx
}
async function finalSay(ctx: Ctx) {
  console.log("finally")
  return ctx
}

const routeGet = createRoute("GET")
const firstAndSecond = compose(second, first)

const firstHandler = routeGet({ pathname: "*" })(third, firstAndSecond)
const secondHandler = routeGet({ pathname: "*" })(firstAndSecond)
const catchHandler = createRoute("POST", "GET", "DELETE")({ pathname: "*" })(
  catchIt
)
const finallyHandler = createRoute("ALL")({ pathname: "*" })(finalSay)

const handler = createHandler(Ctx)(secondHandler, firstHandler)(catchHandler)(
  finallyHandler
)

await listen({ port: 8080 })(handler)
```

## Dependency

The `http/server.ts` module from Deno's `std` library.
