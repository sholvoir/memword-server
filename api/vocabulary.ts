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
import user from "../mid/user.ts";

const app = new Hono<jwtEnv>();

app.get(async () => {
   const [vocab, checksum] = await getVocabulary()
   return new Response(
      Array.from(vocab).sort().join("\n"),
      { headers: { "Check-Sum": checksum } },
   );
})
   .post(user, auth, admin, async (c) => {
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      await addToVocabulary(text.split("/n"));
      console.log(`API vocabulary POST successed`);
      return emptyResponse();
   })
   .delete(user, auth, admin, async (c) => {
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      await deleteFromVocabulary(text.split("/n"));
      console.log(`API vocabulary DELETE successed`);
      return emptyResponse();
   })
   .get(
      "/checksum",
      async () => {
         const [_, checksum] = await getVocabulary()
         return new Response(null, { headers: { "Check-Sum": checksum } });
      },
   );

export default app;
