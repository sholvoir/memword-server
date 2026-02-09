import { setCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono/types";
import type { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";

const maxAge = 180 * 24 * 60 * 60;
const cookie: MiddlewareHandler<jwtEnv> = async (c, next) => {
   await next();
   const username = c.get("username");
   const token = await jwt.createToken(maxAge, { aud: username });
   setCookie(c, "auth", token, {
      maxAge,
      domain: ".micinfotech.com",
      path: "/",
      secure: true,
      httpOnly: true,
   });
};

export default cookie;
