import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import type { ITask } from "../lib/itask.ts";
import { getCollectionTask } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, async (c) => {
      const username = c.get("username");
      const collectionTask = getCollectionTask(username);
      const tasks: Array<ITask> = [];
      for await (const { _id, ...task } of collectionTask.find())
         tasks.push(task);
      console.log(`API task GET ${username} return ${tasks.length}.`);
      return c.json(tasks);
   })
   .patch(auth, async (c) => {
      const username = c.get("username");
      const traces: Array<ITask> = await c.req.json();
      if (!traces || !Array.isArray(traces))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      for (const { word, last, next, level } of traces) {
         const r = await collectionTask.updateOne(
            { word, last: { $lt: last } },
            { $set: { last, next, level } },
            { upsert: true },
         );
         if (!r.acknowledged)
            return emptyResponse(STATUS_CODE.InternalServerError);
      }
      console.log(`API task PATCH ${username} upload ${traces.length}.`);
      return emptyResponse();
   })
   .delete(auth, async (c) => {
      const username = c.get("username");
      const words: Array<string> = await c.req.json();
      if (!words || !Array.isArray(words))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      const r = await collectionTask.deleteMany({ word: { $in: words } });
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
   });
