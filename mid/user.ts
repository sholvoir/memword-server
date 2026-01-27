import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono/types";
import type { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";

const m: MiddlewareHandler<jwtEnv> = async (c, next) => {
   const token =
      c.req.query("auth") ||
      getCookie(c, "auth") ||
      c.req
         .header("Authorization")
         ?.match(/Bearer (.*)/)
         ?.at(1);

   let username = "";
   if (token)
      try {
         const payload = await jwt.verifyToken(token);
         if (payload) username = payload.aud as string;
      } catch {}
   if (username) c.set("username", username);
   await next();
};

export default m;
