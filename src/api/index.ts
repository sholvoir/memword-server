import { DOMParser } from "@b-fuze/deno-dom";
import type { Hono } from "hono";
import auth from "../mid/auth.ts";
import cookie from "../mid/cookie.ts";

const url = "https://www.micinfotech.com/memword/";

const apply = (app: Hono) => {
   app.get("/", auth, cookie, async (c) => {
      const res = await fetch(`${url}index.html`);
      if (!res.ok) return res;
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      if (!doc) return c.text("Error parsing HTML");
      const base = doc.createElement("base");
      base.setAttribute("href", url);
      doc.head.insertBefore(base, doc.head.firstChild);
      const username = c.get("username");
      doc.querySelector("head.meta[name='username']")?.setAttribute(
         "content",
         username,
      );
      return c.html(doc.documentElement?.outerHTML ?? "");
   });
   app.get("/about", async (c) => {
      const res = await fetch(`${url}about.html`);
      if (!res.ok) return res;
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      if (!doc) return c.text("Error parsing HTML");
      const base = doc.createElement("base");
      base.setAttribute("href", url);
      doc.head.insertBefore(base, doc.head.firstChild);
      return c.html(doc.documentElement?.outerHTML ?? "");
   });
};

export default apply;
