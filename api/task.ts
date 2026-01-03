// deno-lint-ignore-file no-explicit-any
/** biome-ignore-all lint/suspicious/noExplicitAny: <no reason> */

import {
   emptyResponse,
   jsonResponse,
   STATUS_CODE,
} from "@sholvoir/generic/http";
import type { ITask } from "@sholvoir/memword-common/itask";
import { Hono } from "hono";
import { Int32 } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import { getCollectionTask } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";
import user from "../mid/user.ts";

const app = new Hono<jwtEnv>();

app.post(user, auth, async (c) => {
   const username = c.get("username");
   const clientTasks: Array<ITask> = await c.req.json();
   if (!clientTasks || !Array.isArray(clientTasks))
      return emptyResponse(STATUS_CODE.BadRequest);
   const collectionTask = getCollectionTask(username);
   const serverTasks = new Map<string, ITask>();
   for await (const task of collectionTask.find())
      serverTasks.set(task.word, task);
   for (const ctask of clientTasks) {
      delete ctask._id;
      const stask = serverTasks.get(ctask.word);
      if (!stask) {
         await collectionTask.insertOne(ctask);
         serverTasks.set(ctask.word, ctask);
      } else if (ctask.last > stask.last) {
         await collectionTask.updateOne(
            { word: ctask.word },
            {
               $set: {
                  last: new Int32(ctask.last),
                  next: new Int32(ctask.next),
                  level: new Int32(ctask.level),
               } as any,
            },
         );
         serverTasks.set(ctask.word, ctask);
      }
   }
   console.log(
      `API task POST ${username} with tasks ${clientTasks.length}, return ${serverTasks.size}.`,
   );
   return jsonResponse(
      Array.from(serverTasks.values().map((task) => (delete task._id, task))),
   );
})
   .delete(user, auth, async (c) => {
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
   })
   .put(user, auth, async (c) => {
      const username = c.get("username");
      const ctask: ITask = await c.req.json();
      if (!ctask) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      const stask = await collectionTask.findOne({ word: ctask.word });
      if (!stask) {
         delete ctask._id;
         await collectionTask.insertOne(ctask);
      } else if (ctask.last > stask.last) {
         await collectionTask.updateOne({ word: ctask.word }, {
            $set: {
               last: new Int32(ctask.last),
               next: new Int32(ctask.next),
               level: new Int32(ctask.level),
            },
         } as any);
      }
      console.log(`API task PUT ${username} with task ${ctask.word}.`);
      return emptyResponse();
   });

export default app;
