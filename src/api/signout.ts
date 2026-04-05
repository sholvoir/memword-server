import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";

export default new Hono().get((c) => {
   deleteCookie(c, "auth", {
      domain: ".micinfotech.com",
      path: "/",
      secure: true,
      httpOnly: true,
   });
   return c.newResponse(null, { status: 204 });
});
