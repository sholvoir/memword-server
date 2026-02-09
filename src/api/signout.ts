import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";

const app = new Hono();

app.get((c) => {
   deleteCookie(c, "auth", {
      domain: ".micinfotech.com",
      path: "/",
      secure: true,
      httpOnly: true,
   });
   return c.newResponse(null, { status: 204 });
});

export default app;
