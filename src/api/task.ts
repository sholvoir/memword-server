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

const app = new Hono<jwtEnv>();

app.post(auth, async (c) => {
   const username = c.get("username");
   const clientTasks: Array<ITask> = await c.req.json();
   if (!clientTasks || !Array.isArray(clientTasks))
      return emptyResponse(STATUS_CODE.BadRequest);
   const collectionTask = getCollectionTask(username);
   const serverTasks = new Map<string, ITask>();
   for await (const task of collectionTask.find({}, { projection: { _id: 0 } }))
      serverTasks.set(task.word, task);
   for (const ctask of clientTasks) {
      const stask = serverTasks.get(ctask.word);
      if (!stask) {
         await collectionTask.insertOne(ctask);
         serverTasks.set(ctask.word, ctask);
      } else if (+ctask.last > +stask.last) {
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
      `API task POST ${username} with tasks ${clientTasks.length}, return ${serverTasks.size}.`,
   );
   return jsonResponse(Array.from(serverTasks.values()));
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
   })
   .put(auth, async (c) => {
      const username = c.get("username");
      const ctask: ITask = await c.req.json();
      if (!ctask) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionTask = getCollectionTask(username);
      const stask = await collectionTask.findOne(
         { word: ctask.word },
         { projection: { _id: 0 } },
      );
      if (!stask) {
         await collectionTask.insertOne(ctask);
      } else if (+ctask.last > +stask.last) {
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
      }
      console.log(`API task PUT ${username} with task ${ctask.word}.`);
      return emptyResponse();
   });

export default app;
