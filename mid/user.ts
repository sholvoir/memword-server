// deno-lint-ignore-file no-empty
import { MiddlewareHandler } from "hono/types";
import { getCookie } from "hono/cookie";
import { jwt } from '../lib/jwt.ts';
import { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (c, next) => {
    const token = c.req.query('auth') ||
        getCookie(c, 'auth') ||
        c.req.header('Authorization')?.match(/Bearer (.*)/)?.at(1);

    let username = '';
    if (token) try {
        const payload = await jwt.verifyToken(token);
        if (payload) username = payload.aud as string;
    } catch {}
    if (username) c.set('username', username);
    await next();
}

export default m;