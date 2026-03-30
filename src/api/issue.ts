import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import { collectionIssue, dictIssue } from "../lib/mongo.ts";
import admin from "../mid/admin.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, admin, async (c) => {
      const issues = [];
      for await (const issue of collectionIssue.find()) issues.push(issue);
      console.log(`API issue GET successed`);
      return c.json(issues);
   })
   .post(auth, async (c) => {
      const reporter = c.get("username");
      const d = c.req.query("d");
      const issue = (await c.req.json()).issue;
      if (!issue) return emptyResponse(STATUS_CODE.BadRequest);
      if (d) {
         const sissue = await dictIssue.findOne({ issue });
         if (sissue) return emptyResponse(STATUS_CODE.Conflict);
         const result = await dictIssue.insertOne({ issue });
         if (!result.acknowledged) {
            console.log(`API dict issue POST ${issue} database write error`);
            return emptyResponse(STATUS_CODE.InternalServerError);
         } else {
            console.log(
               `API dict issue POST ${issue} successed. id: ${result.insertedId}`,
            );
            return c.text(`${result.insertedId}`, STATUS_CODE.Created);
         }
      } else {
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
            return c.text(`${result.insertedId}`, STATUS_CODE.Created);
         }
      }
   })
   .delete(auth, admin, async (c) => {
      const id = c.req.query("id");
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
