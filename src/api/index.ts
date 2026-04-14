import type { Hono } from "hono";
import pkg from "../../deno.json" with { type: "json" };
import auth from "../mid/auth.ts";
import renew from "../mid/renew.ts";

const url = "https://www.micinfotech.com/memword";

const apply = (app: Hono) => {
   app.get("/", auth, renew, () => fetch(`${url}/index.html`));
   app.get("/about", () => fetch(`${url}/about.html`));
   app.get("/version", (c) => c.text(pkg.version));
   app.get("/manifest.json", () => fetch(`${url}/manifest.json`));
   app.get("/assets/*", (c) => fetch(`${url}${c.req.path}`));
   app.get("/icon/*", (c) => fetch(`${url}${c.req.path}`));
};

export default apply;
