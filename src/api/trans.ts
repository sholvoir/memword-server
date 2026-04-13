import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import trans from "../lib/baidu-trans.ts";
import type { jwtEnv } from "../lib/env.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>().post(auth, async (c) => {
   const text = await c.req.text();
   const result = await trans(text);
   if (!result) return emptyResponse(STATUS_CODE.InternalServerError);
   console.log(`API trans POST "${text}"`);
   return c.text(result);
});
