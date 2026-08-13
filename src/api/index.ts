import type { Hono } from "hono";
import { proxy } from "hono/proxy";

const url = "https://www.micinfotech.com/memword";

const apply = (app: Hono<any>) => {
   app.get("/", () => proxy(`${url}/index.html`));
   app.get("/manifest.json", () => proxy(`${url}/manifest.json`));
   app.get("/assets/*", (c) => proxy(`${url}${c.req.path}`));
   app.get("/icon/*", (c) => proxy(`${url}${c.req.path}`));
};

export default apply;
