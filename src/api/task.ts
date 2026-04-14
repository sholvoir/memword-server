import {
   emptyResponse,
   jsonResponse,
   STATUS_CODE,
} from "@sholvoir/generic/http";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import type { ITask } from "../lib/itask.ts";
import { getCollectionTask } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .post(auth, async (c) => {
      const username = c.get("username");
      const sync = c.req.query("sync");
      const clientTasks: Array<ITask> = await c.req.json();
      if (!clientTasks || !Array.isArray(clientTasks))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      const serverTasks = new Map<string, ITask>();
      for await (const task of collectionTask.find(
         sync ? {} : { word: { $in: clientTasks.map((t) => t.word) } },
         { projection: { _id: 0 } },
      ))
         serverTasks.set(task.word, task);
      for (const ctask of clientTasks) {
         const stask = serverTasks.get(ctask.word);
         if (!stask) {
            const r = await collectionTask.insertOne(ctask);
            if (!r.acknowledged)
               return emptyResponse(STATUS_CODE.InternalServerError);
            serverTasks.set(ctask.word, ctask);
         } else if (ctask.last > stask.last) {
            const r = await collectionTask.updateOne(
               { word: ctask.word },
               {
                  $set: {
                     last: ctask.last,
                     next: ctask.next,
                     level: ctask.level,
                  },
               },
            );
            if (!r.acknowledged)
               return emptyResponse(STATUS_CODE.InternalServerError);
            serverTasks.set(ctask.word, ctask);
         }
      }
      console.log(
         `API task POST ${username} upload ${clientTasks.length}, ${
            sync ? `return ${serverTasks.size}` : "Without Sync"
         }.`,
      );
      return sync
         ? jsonResponse(Array.from(serverTasks.values()))
         : emptyResponse();
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
