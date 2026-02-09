import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import type { MiddlewareHandler } from "hono/types";
import type { jwtEnv } from "../lib/env.ts";

const admin = Deno.env.get("ADMIN")!;

const m: MiddlewareHandler<jwtEnv> = async (ctx, next) => {
   const username = ctx.get("username");
   if (username !== admin) return emptyResponse(STATUS_CODE.Unauthorized);
   await next();
};

export default m;
