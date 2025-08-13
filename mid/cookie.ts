import { MiddlewareHandler } from "hono/types";
import { jwtEnv } from "../lib/env.ts";
import { setAuth } from "../lib/jwt.ts";

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
    await next();
    const aud = ctx.get('username');
    setAuth(ctx.res, aud);
}

export default m;