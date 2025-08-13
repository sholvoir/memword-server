import { MiddlewareHandler } from "hono/types";
import { jwt, getToken } from '../lib/jwt.ts';
import { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
    const token = getToken(ctx.req.raw);
    let username = '';
    if (token) {
        const payload = await jwt.verifyToken(token);
        if (payload) username = payload.aud as string;
    }
    if (username) ctx.set('username', username);
    await next();
}

export default m;