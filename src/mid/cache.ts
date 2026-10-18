import type { MiddlewareHandler } from "hono/types";
import type { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
   await next();
   ctx.header("Cache-Control", "no-store");
};

export default m;
