import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { now } from "@sholvoir/memword-common/common";
import type { IDict } from "@sholvoir/memword-common/idict";
import { Hono } from "hono";
import { getDict } from "../lib/dict.ts";
import type { jwtEnv } from "../lib/env.ts";
import { collectionDict } from "../lib/mongo.ts";
import { getVocabulary } from "../lib/spell-check.ts";
import admin from "../mid/admin.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();

app.get(async (c) => {
   const word = c.req.query("q");
   if (!word) return emptyResponse(STATUS_CODE.BadRequest);
   const dict = await collectionDict.findOne({ word });
   if (dict) {
      console.log(`API 'dict' GET word: ${word} (cached)`);
      return c.json(dict);
   }
   const ndict = await getDict(word);
   const [vocab] = await getVocabulary();
   if (vocab.has(word)) await collectionDict.insertOne(ndict!);
   console.log(`API 'dict' GET word: ${word}`);
   return c.json(ndict);
})
   .put(auth, admin, async (c) => {
      const clientDict = (await c.req.json()) as IDict;
      if (!clientDict) return emptyResponse(STATUS_CODE.BadRequest);
      delete clientDict._id;
      clientDict.version = now();
      const result = await collectionDict.replaceOne(
         { word: clientDict.word },
         clientDict,
         { upsert: true },
      );
      if (!result.acknowledged)
         return emptyResponse(STATUS_CODE.InternalServerError);
      console.log(`API dict PUT ${clientDict.word}`);
      return emptyResponse();
   })
   .delete(auth, admin, async (c) => {
      const word = c.req.query("q");
      if (!word) return emptyResponse(STATUS_CODE.BadRequest);
      const result = await collectionDict.deleteOne({ word });
      if (!result.deletedCount) return emptyResponse(STATUS_CODE.NotFound);
      console.log(`API dict DELETE ${word}`);
      return emptyResponse();
   });

export default app;
