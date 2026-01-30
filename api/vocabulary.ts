import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import {
   addToVocabulary,
   deleteFromVocabulary,
   getVocabulary,
} from "../lib/spell-check.ts";
import admin from "../mid/admin.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();

app.get(async (c) => {
   const [vocab, checksum] = await getVocabulary();
   return c.json({ words: Array.from(vocab).sort(), checksum });
})
   .post(auth, admin, async (c) => {
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      await addToVocabulary(text.split("/n"));
      console.log(`API vocabulary POST successed`);
      return emptyResponse();
   })
   .delete(auth, admin, async (c) => {
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      await deleteFromVocabulary(text.split("/n"));
      console.log(`API vocabulary DELETE successed`);
      return emptyResponse();
   })
   .get("/checksum", async (c) => {
      const [_, checksum] = await getVocabulary();
      return c.json({ checksum });
   });

export default app;
