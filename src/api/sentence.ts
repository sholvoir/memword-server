import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import type { ISentence } from "../lib/isentence.ts";
import { type ITrace, toTrace } from "../lib/itrace.ts";
import { getCollectionSTI } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, async (c) => {
      const username = c.get("username");
      const collectionST = getCollectionSTI(username);
      const sts = [];
      for await (const st of collectionST.find(
         {},
         { projection: { _id: 1, last: 1, next: 1, level: 1 } },
      )) {
         st.id = st._id.toString();
         delete (st as any)._id;
         sts.push(st);
      }
      console.log(`API sentence GET ${username} return ${sts.length}.`);
      return c.json(sts);
   })
   .patch(auth, async (c) => {
      const username = c.get("username");
      const traces: Array<ITrace> = await c.req.json();
      if (!traces || !Array.isArray(traces))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionSTI = getCollectionSTI(username);
      for (const trace of traces) {
         if (!trace.id) continue;
         const r = await collectionSTI.updateOne(
            { _id: new ObjectId(trace.id), last: { $lt: trace.last } },
            { $set: toTrace(trace) },
         );
         if (!r.acknowledged)
            return emptyResponse(STATUS_CODE.InternalServerError);
      }
      console.log(`API sentence PATCH ${username} upload ${traces.length}.`);
      return emptyResponse();
   })
   .delete(auth, async (c) => {
      const username = c.get("username");
      const ids: Array<string> = await c.req.json();
      if (!ids || !Array.isArray(ids))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionSTI(username);
      const r = await collectionST.deleteMany({
         _id: { $in: ids.map((id) => new ObjectId(id)) },
      });
      if (!r.acknowledged) {
         console.log(
            `API sentence DELETE from "${username}", database write error.`,
         );
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
      if (!r.deletedCount) {
         console.log(`API sentence DELETE from "${username}", not found.`);
         return emptyResponse(STATUS_CODE.NotFound);
      } else {
         console.log(
            `API sentence DELETE  from "${username}", "${ids.length}/${r.deletedCount}" successed.`,
         );
         return emptyResponse();
      }
   })
   .post(auth, async (c) => {
      const username = c.get("username");
      const st: ISentence & ITrace = await c.req.json();
      if (!st) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionSTI(username);
      if ((st as any)._id) delete (st as any)._id;
      if (st.id) delete st.id;
      try {
         const r = await collectionST.insertOne(st);
         if (!r.acknowledged) {
            console.log(
               `API sentence POST from "${username}", database write error.`,
            );
            return emptyResponse(STATUS_CODE.InternalServerError);
         }
         console.log(`API sentence POST from "${username}", successed.`);
         return c.text(r.insertedId.toString());
      } catch (err: any) {
         console.error(`API sentence POST. error: ${err}`);
         if (err.code === 11000) return emptyResponse(STATUS_CODE.Conflict);
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
   })
   .get(":id", auth, async (c) => {
      const username = c.get("username");
      const id = c.req.param("id");
      if (!id) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionSTI(username);
      const st = await collectionST.findOne(
         { _id: new ObjectId(id) },
         { projection: { sentence: 1, trans: 1, _id: 0 } },
      );
      if (!st) return emptyResponse(STATUS_CODE.NotFound);
      return c.json(st);
   });
