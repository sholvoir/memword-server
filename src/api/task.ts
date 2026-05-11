import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import type { ITask } from "../lib/itask.ts";
import { toTrace } from "../lib/itrace.ts";
import { getCollectionTask } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, async (c) => {
      const username = c.get("username");
      const collectionTask = getCollectionTask(username);
      const tasks = [];
      for await (const task of collectionTask.find(
         {},
         { projection: { _id: 0 } },
      ))
         tasks.push(task);
      console.log(`API task GET ${username} return ${tasks.length}.`);
      return c.json(tasks);
   })
   .patch(auth, async (c) => {
      const username = c.get("username");
      const clientTasks: Array<ITask> = await c.req.json();
      if (!clientTasks || !Array.isArray(clientTasks))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      const serverTasks = new Map<string, ITask>();
      for await (const task of collectionTask.find(
         { word: { $in: clientTasks.map((t) => t.word) } },
         { projection: { _id: 0 } },
      ))
         serverTasks.set(task.word, task);
      for (const ctask of clientTasks) {
         const stask = serverTasks.get(ctask.word);
         if (!stask) {
            const r = await collectionTask.insertOne(ctask);
            if (!r.acknowledged)
               return emptyResponse(STATUS_CODE.InternalServerError);
         } else if (ctask.last > stask.last) {
            const r = await collectionTask.updateOne(
               { word: ctask.word },
               { $set: toTrace(ctask) },
            );
            if (!r.acknowledged)
               return emptyResponse(STATUS_CODE.InternalServerError);
         }
      }
      console.log(`API task PATCH ${username} upload ${clientTasks.length}.`);
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
