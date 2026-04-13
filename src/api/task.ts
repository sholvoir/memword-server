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
            await collectionTask.insertOne(ctask);
            serverTasks.set(ctask.word, ctask);
         } else if (ctask.last > stask.last) {
            await collectionTask.updateOne(
               { word: ctask.word },
               {
                  $set: {
                     last: ctask.last,
                     next: ctask.next,
                     level: ctask.level,
                  },
               },
            );
            serverTasks.set(ctask.word, ctask);
         }
      }
      console.log(
         `API task POST ${username} with tasks ${clientTasks.length}, ${
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
      const deleteResult = await collectionTask.deleteMany({
         word: { $in: words },
      });
      console.log(
         `API task DELETE ${username} with tasks ${deleteResult.deletedCount}.`,
      );
      return jsonResponse(deleteResult);
   });
