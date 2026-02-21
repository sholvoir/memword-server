import type { MiddlewareHandler } from "hono/types";
import { maxAge } from "../lib/common.ts";
import { setAuthCookie } from "../lib/cookie.ts";
import type { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
   await next();
   if (ctx.get("exp") - Date.now() / 1000 < maxAge / 3) {
      setAuthCookie(ctx, ctx.get("username"));
   }
};

export default m;
