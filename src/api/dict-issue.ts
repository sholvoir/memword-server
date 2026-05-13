import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import { dictIssue } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>().post(auth, async (c) => {
   const issue = await c.req.text();
   if (!issue) return emptyResponse(STATUS_CODE.BadRequest);
   try {
      const result = await dictIssue.insertOne({ issue });
      if (!result.acknowledged) {
         console.log(`API dict-issue POST ${issue} database write error`);
         return emptyResponse(STATUS_CODE.InternalServerError);
      } else {
         console.log(
            `API dict-issue POST ${issue} successed. id: ${result.insertedId}`,
         );
         return c.text(`${result.insertedId}`, STATUS_CODE.Created);
      }
   } catch (err: any) {
      console.error(`API dict-issue POST. error: ${err}`);
      if (err.code === 11000) return emptyResponse(STATUS_CODE.Conflict);
      return emptyResponse(STATUS_CODE.InternalServerError);
   }
});
