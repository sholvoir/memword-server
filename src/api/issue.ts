import type { IIDIssue } from "@sholvoir/dict-server/lib/iissue.ts";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import { collectionIssue } from "../lib/mongo.ts";
import admin from "../mid/admin.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, admin, async (c) => {
      const issues: Array<IIDIssue> = [];
      for await (const { _id, ...rest } of collectionIssue.find())
         issues.push({ id: _id.toString(), ...rest });
      console.log(`API issue GET successed`);
      return c.json(issues);
   })
   .post(auth, async (c) => {
      const reporter = c.get("username");
      const issue = await c.req.text();
      if (!issue) return emptyResponse(STATUS_CODE.BadRequest);
      try {
         const result = await collectionIssue.insertOne({ reporter, issue });
         if (!result.acknowledged) {
            console.log(
               `API issue POST ${reporter} ${issue} database write error`,
            );
            return emptyResponse(STATUS_CODE.InternalServerError);
         } else {
            console.log(
               `API issue POST ${reporter} ${issue} successed. id: ${result.insertedId}`,
            );
            return c.text(result.insertedId.toString(), STATUS_CODE.Created);
         }
      } catch (err: any) {
         console.error(`API issue POST. error: ${err}`);
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
   })
   .delete(":id", auth, admin, async (c) => {
      const id = c.req.param("id");
      if (!id) return emptyResponse(STATUS_CODE.BadRequest);
      const result = await collectionIssue.deleteOne({ _id: new ObjectId(id) });
      if (!result.acknowledged) {
         console.log(`API issue DELETE ${id} database write error`);
         return c.json(result, STATUS_CODE.InternalServerError);
      } else if (!result.deletedCount) {
         console.log(`API issue DELETE ${id}`);
         return c.json(result);
      }
   });
