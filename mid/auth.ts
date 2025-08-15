import { MiddlewareHandler } from "hono/types";
// import { HTTPException } from "hono/http-exception";
// import { STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";

const m: MiddlewareHandler<jwtEnv> = async (c, next) => {
    const username = c.get('username');
    
    if (!username) return c.redirect('/about')
    // throw new HTTPException(STATUS_CODE.Unauthorized);
    await next();
}

export default m;