import { MiddlewareHandler } from "hono/types";
import { HTTPException } from "hono/http-exception";
import { STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
    const username = ctx.get('username');
    if (!username) throw new HTTPException(STATUS_CODE.Unauthorized);
    await next();
}

export default m;