import { MiddlewareHandler } from "hono/types";
import { HTTPException } from "hono/http-exception";
import { STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";

const admin = Deno.env.get('ADMIN')!;

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
    const username = ctx.get('username');
    if (username == admin) await next();
    else throw new HTTPException(STATUS_CODE.Unauthorized);
}

export default m;