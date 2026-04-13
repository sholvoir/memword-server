import {
   emptyResponse,
   jsonResponse,
   STATUS_CODE,
} from "@sholvoir/generic/http";
import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import type { ISentence } from "../lib/isentence.ts";
import { getCollectionST } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .post(auth, async (c) => {
      const username = c.get("username");
      const st: ISentence = await c.req.json();
      if (!st) return emptyResponse(STATUS_CODE.BadRequest);
      if (!st.sentence) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const now = Date.now();
      const r = await collectionST.insertOne({
         sentence: st.sentence,
         last: st.last ?? now,
         next: st.next ?? now,
         level: st.level ?? 0,
      });
      if (!r.acknowledged) {
         console.log(
            `API sentence POST ${username} "${st.sentence}" database write error`,
         );
         return emptyResponse(STATUS_CODE.InternalServerError);
      } else {
         console.log(
            `API sentence POST ${username} "${st.sentence}", id: ${r.insertedId}`,
         );
         return jsonResponse({ id: r.insertedId.toString() });
      }
   })
   .patch(auth, async (c) => {
      const username = c.get("username");
      const clientSTs: Array<ISentence> = await c.req.json();
      if (!clientSTs || !Array.isArray(clientSTs))
         return emptyResponse(STATUS_CODE.BadRequest);
      //
      const collectionST = getCollectionST(username);
      const serverSTs = new Map<string, ISentence>();
      for await (const st of collectionST.find(
         {},
         { projection: { _id: 0, trans: 0 } },
      )) {
         serverSTs.set(st.sentence, st);
      }
      //
      for (const cst of clientSTs) {
         const sst = serverSTs.get(cst.sentence);
         if (!sst) continue;
         if (cst.last > sst.last) {
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
         `API task POST ${username} with tasks ${clientSTs.length}, return ${serverSTs.size}.`,
      );
      return jsonResponse(serverSTs.values());
   })
   .put(auth, async (c) => {
      const username = c.get("username");
      const st: ISentence = await c.req.json();
      if (!st) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const r = await collectionST.replaceOne({ sentence: st.sentence }, st);
      if (!r.matchedCount) return emptyResponse(STATUS_CODE.NotFound);
      if (!r.modifiedCount || !r.acknowledged)
         return emptyResponse(STATUS_CODE.InternalServerError);
      return emptyResponse();
   })
   .get(":id", auth, async (c) => {
      const username = c.get("username");
      const id = c.req.param("id");
      if (!id) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const st = await collectionST.findOne(
         { _id: new ObjectId(id) },
         { projection: { word: 1, _id: 0 } },
      );
      if (!st) return emptyResponse(STATUS_CODE.NotFound);
      return jsonResponse(st);
   })
   .delete(":id", auth, async (c) => {
      const username = c.get("username");
      const id = c.req.param("id");
      if (!id) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionST(username);
      const r = await collectionST.deleteOne({ _id: new ObjectId(id) });
      if (!r.acknowledged) {
         console.log(`API sentence DELETE ${id} database write error`);
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
      if (!r.deletedCount) {
         console.log(`API sentence DELETE ${id} not found.`);
         return emptyResponse(STATUS_CODE.NotFound);
      } else {
         console.log(`API sentence DELETE ${id} successed.`);
         return emptyResponse();
      }
   });
