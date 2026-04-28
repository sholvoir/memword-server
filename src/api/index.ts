import type { Hono } from "hono";

const url = "https://www.micinfotech.com/memword";

const apply = (app: Hono<any>) => {
   app.get("/", () => fetch(`${url}/index.html`));
   app.get("/manifest.json", () => fetch(`${url}/manifest.json`));
   app.get("/assets/*", (c) => fetch(`${url}${c.req.path}`));
   app.get("/icon/*", (c) => fetch(`${url}${c.req.path}`));
};

export default apply;
