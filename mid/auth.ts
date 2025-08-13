import { MiddlewareHandler } from "hono/types";
import { HTTPException } from "hono/http-exception";
import { STATUS_CODE } from "@sholvoir/generic/http";
import { jwt, getToken } from '../lib/jwt.ts';
import { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
    const err = new HTTPException(STATUS_CODE.Unauthorized);
    const token = getToken(ctx.req.raw);
    if (!token) throw err;
    const payload = await jwt.verifyToken(token);
    if (!payload) throw err;
    if (!payload.aud) throw err;
    ctx.set('username', payload.aud as string);
    await next();
}

export default m;