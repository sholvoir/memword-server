import {
   emptyResponse,
   jsonResponse,
   STATUS_CODE,
} from "@sholvoir/generic/http";
import { Hono } from "hono";
import trans from "../lib/baidu-trans.ts";
import type { jwtEnv } from "../lib/env.ts";
import type { ISentence } from "../lib/isentence.ts";
import { getCollectionST } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .post(auth, async (c) => {
      const username = c.get("username");
      const sync = c.req.query("sync");
      const clientSTs: Array<ISentence> = await c.req.json();
      if (!clientSTs || !Array.isArray(clientSTs))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const serverSTs = new Map<string, ISentence>();
      for await (const st of collectionST.find(
         sync ? {} : { sentence: { $in: clientSTs.map((s) => s.sentence) } },
         { projection: { _id: 0, trans: 0 } },
      ))
         serverSTs.set(st.sentence, st);
      for (const cst of clientSTs) {
         const sst = serverSTs.get(cst.sentence);
         if (!sst) {
            cst.trans = await trans(cst.sentence);
            const r = await collectionST.insertOne(cst);
            if (!r.acknowledged)
               return emptyResponse(STATUS_CODE.InternalServerError);
            serverSTs.set(cst.sentence, cst);
         } else if (cst.last > sst.last) {
            const r = await collectionST.updateOne(
               { sentence: cst.sentence },
               {
                  $set: {
                     last: cst.last,
                     next: cst.next,
                     level: cst.level,
                  },
               },
            );
            if (!r.acknowledged)
               return emptyResponse(STATUS_CODE.InternalServerError);
            serverSTs.set(cst.sentence, cst);
         }
      }
      console.log(
         `API sentence POST ${username} upload ${clientSTs.length}, ${
            sync ? `return ${serverSTs.size}` : "Without Sync"
         }.`,
      );
      return sync
         ? jsonResponse(Array.from(serverSTs.values()))
         : emptyResponse();
   })
   .get(auth, async (c) => {
      const username = c.get("username");
      const sentence = c.req.query("st");
      if (!sentence) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const st = await collectionST.findOne(
         { sentence },
         { projection: { trans: 1, _id: 0 } },
      );
      if (!st) return emptyResponse(STATUS_CODE.NotFound);
      return c.text(st.trans ?? "");
   })
   .delete(auth, async (c) => {
      const username = c.get("username");
      const sentence = c.req.query("st");
      if (!sentence) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const r = await collectionST.deleteOne({ sentence });
      if (!r.acknowledged) {
         console.log(
            `API sentence DELETE "${sentence}" from "${username}", database write error.`,
         );
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
      if (!r.deletedCount) {
         console.log(`API sentence DELETE "${sentence}", not found.`);
         return emptyResponse(STATUS_CODE.NotFound);
      } else {
         console.log(`API sentence DELETE "${sentence}" successed.`);
         return emptyResponse();
      }
   });
