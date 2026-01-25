import { MiddlewareHandler } from "hono/types";
import { jwtEnv } from "../lib/env.ts";
import { emptyResponse } from "@sholvoir/generic/http";
import { STATUS_CODE } from "@sholvoir/generic/http";

const m: MiddlewareHandler<jwtEnv> = async (c, next) => {
    const username = c.get('username');
    if (!username) return emptyResponse(STATUS_CODE.Unauthorized);
    await next();
}

export default m;