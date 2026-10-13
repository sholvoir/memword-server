import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { ObjectId } from "mongodb";
import type { jwtEnv } from "../lib/env.ts";
import type { ICard } from "../lib/icard.ts";
import { type ITrace, toTrace } from "../lib/itrace.ts";
import { getCollectionCard } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>()
   .get(auth, async (c) => {
      const username = c.get("username");
      const collectionCard = getCollectionCard(username);
      const cards: Array<ICard> = [];
      for await (const card of collectionCard.find(
         {},
         { projection: { _id: 1, last: 1, next: 1, level: 1 } },
      )) {
         card.id = card._id.toString();
         delete (card as any)._id;
         cards.push(card);
      }
      console.log(`API card GET ${username} return ${cards.length}.`);
      return c.json(cards);
   })
   .patch(auth, async (c) => {
      const username = c.get("username");
      const traces: Array<ITrace & { id: string }> = await c.req.json();
      if (!traces || !Array.isArray(traces))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionCard = getCollectionCard(username);
      for (const trace of traces) {
         if (!trace.id) continue;
         const r = await collectionCard.updateOne(
            { _id: new ObjectId(trace.id), last: { $lt: trace.last } },
            { $set: toTrace(trace) },
         );
         if (!r.acknowledged)
            return emptyResponse(STATUS_CODE.InternalServerError);
      }
      console.log(`API card PATCH ${username} upload ${traces.length}.`);
      return emptyResponse();
   })
   .delete(auth, async (c) => {
      const username = c.get("username");
      const ids: Array<string> = await c.req.json();
      if (!ids || !Array.isArray(ids))
         return emptyResponse(STATUS_CODE.BadRequest);
      const collectionCard = getCollectionCard(username);
      const r = await collectionCard.deleteMany({
         _id: { $in: ids.map((id) => new ObjectId(id)) },
      });
      if (!r.acknowledged) {
         console.log(
            `API card DELETE from "${username}", database write error.`,
         );
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
      if (!r.deletedCount) {
         console.log(`API card DELETE from "${username}", not found.`);
         return emptyResponse(STATUS_CODE.NotFound);
      } else {
         console.log(
            `API card DELETE  from "${username}", "${ids.length}/${r.deletedCount}" successed.`,
         );
         return emptyResponse();
      }
   })
   .post(auth, async (c) => {
      const username = c.get("username");
      const card = await c.req.json();
      if (!card) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionST = getCollectionCard(username);
      if (card._id) delete card._id;
      if (card.id) delete card.id;
      try {
         const r = await collectionST.insertOne(card);
         if (!r.acknowledged) {
            console.log(
               `API card POST from "${username}", database write error.`,
            );
            return emptyResponse(STATUS_CODE.InternalServerError);
         }
         console.log(`API card POST from "${username}", successed.`);
         return c.text(r.insertedId.toString());
      } catch (err: any) {
         console.error(`API card POST. error: ${err}`);
         if (err.code === 11000) return emptyResponse(STATUS_CODE.Conflict);
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
   })
   .get(":id", auth, async (c) => {
      const username = c.get("username");
      const id = c.req.param("id");
      if (!id) return emptyResponse(STATUS_CODE.BadRequest);
      const collectionCard = getCollectionCard(username);
      const card = await collectionCard.findOne(
         { _id: new ObjectId(id) },
         { projection: { card: 1, _id: 0 } },
      );
      if (!card) return emptyResponse(STATUS_CODE.NotFound);
      return c.text(card.card);
   });
