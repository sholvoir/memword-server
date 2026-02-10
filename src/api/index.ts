import type { Hono } from "hono";
import auth from "../mid/auth.ts";
import cookie from "../mid/cookie.ts";

const url = "https://www.micinfotech.com/memword";

const apply = (app: Hono) => {
   app.get("/", auth, cookie, async (c) => {
      const res = await fetch(`${url}/index.html`);
      if (!res.ok) return res;
      const text = await res.text();
      const username = c.get("username");
      return c.html(text.replace("{{username}}", username));
   });
   app.get("/about", () => fetch(`${url}/about.html`));
   app.get("/manifest.json", () => fetch(`${url}/manifest.json`));
   app.get("/assets/*", (c) => fetch(`${url}${c.req.path}`));
   app.get("/icon/*", (c) => fetch(`${url}${c.req.path}`));
};

export default apply;
