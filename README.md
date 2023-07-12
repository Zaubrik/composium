# composium

Powered by
[functional composition](https://en.wikipedia.org/wiki/Function_composition) and
the
[URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API),
`composium` has become the most flexible routing framework in the world. Through
its composability it can serve perfectly as a _generic_, _abstract_ and
_minimal_ layer for your own back-end framework.

## URL Pattern

The best way to learn and test the URL Pattern API is Zaubrik's free
[URL Pattern User Interface](https://dev.zaubrik.com/url-pattern/).

## Documentation

```bash
deno doc https://deno.land/x/composium/mod.ts
```

## Example

```ts
import { Context, createDefaultHandler, createGetRoute } from "./mod.ts";

function welcome<C extends Context>(ctx: C) {
  const name = ctx.result.pathname.groups.name || "nobody";
  ctx.response = new Response(`Welcome, ${name}!`);
  return ctx;
}

const route = createGetRoute({ pathname: "/{:name}?" })(welcome);
const handler = createDefaultHandler(route);

Deno.serve(handler);

// curl http://localhost:8080/Joe
// Welcome, Joe!
```

## Discord

Feel free to ask questions and start discussions in our
[discord server](https://discord.gg/6spYphKXAt).
