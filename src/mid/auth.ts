import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono/types";
import type { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";

const auth: MiddlewareHandler<jwtEnv> = async (c, next) => {
   if (Deno.env.get("DEBUG")) {
      c.set("username", "hua");
      await next();
      return;
   }
   const token =
      c.req.query("auth") ||
      getCookie(c, "auth") ||
      c.req
         .header("Authorization")
         ?.match(/Bearer (.*)/)
         ?.at(1);

   let username = "";
   let exp: number | undefined;
   if (token)
      try {
         const payload = await jwt.verifyToken(token);
         if (payload) {
            username = payload.aud as string;
            exp = c.req.query("auth")
               ? Date.now() / 1000 + 60 * 5
               : payload.exp;
         }
      } catch {}
   if (exp !== undefined) c.set("exp", exp);
   if (username) c.set("username", username);
   else return emptyResponse(STATUS_CODE.Unauthorized);
   await next();
};

export default auth;
