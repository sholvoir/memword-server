import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import type { IIDTask } from "../lib/itask.ts";
import type { IIDTrace } from "../lib/itrace.ts";
import { getCollectionTask } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, async (c) => {
      const username = c.get("username");
      const collectionTask = getCollectionTask(username);
      const tasks: Array<IIDTask> = [];
      for await (const { _id, ...rest } of collectionTask.find())
         tasks.push({ id: _id.toString(), ...rest });
      console.log(`API task GET ${username} return ${tasks.length}.`);
      return c.json(tasks);
   })
   .patch(auth, async (c) => {
      const username = c.get("username");
      const traces: Array<IIDTrace> = await c.req.json();
      if (!traces || !Array.isArray(traces))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      for (const { id, last, next, level } of traces) {
         if (!id) continue;
         const r = await collectionTask.updateOne(
            { _id: new ObjectId(id), last: { $lt: last } },
            { $set: { last, next, level } },
         );
         if (!r.acknowledged)
            return emptyResponse(STATUS_CODE.InternalServerError);
      }
      console.log(`API task PATCH ${username} upload ${traces.length}.`);
      return emptyResponse();
   })
   .delete(auth, async (c) => {
      const username = c.get("username");
      const ids: Array<string> = await c.req.json();
      if (!ids || !Array.isArray(ids))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      const r = await collectionTask.deleteMany({
         _id: { $in: ids.map((id) => new ObjectId(id)) },
      });
      if (!r.acknowledged) {
         console.log(
            `API task DELETE from "${username}", database write error.`,
         );
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
      if (!r.deletedCount) {
         console.log(`API task DELETE from ${username}, not found.`);
         return emptyResponse(STATUS_CODE.NotFound);
      } else {
         console.log(
            `API task DELETE ${r.deletedCount} records from ${username}.`,
         );
         return emptyResponse();
      }
   })
   .post(auth, async (c) => {
      const username = c.get("username");
      const task = await c.req.json();
      if (!task) return emptyResponse(STATUS_CODE.BadRequest);
      if (task._id) delete task._id;
      if (task.id) delete task.id;
      const collectionTask = getCollectionTask(username);
      try {
         const r = await collectionTask.insertOne(task);
         if (!r.acknowledged) {
            console.log(
               `API task POST from "${username}", database write error.`,
            );
            return emptyResponse(STATUS_CODE.InternalServerError);
         }
         console.log(`API task POST from "${username}", successed.`);
         return c.text(r.insertedId.toString());
      } catch (err: any) {
         console.error(`API card POST. error: ${err}`);
         if (err.code === 11000) return emptyResponse(STATUS_CODE.Conflict);
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
   });
