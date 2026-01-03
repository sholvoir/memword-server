import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import {
   addToVocabulary,
   deleteFromVocabulary,
   getVocabulary,
   version,
} from "../lib/spell-check.ts";
import admin from "../mid/admin.ts";
import auth from "../mid/auth.ts";
import user from "../mid/user.ts";

const app = new Hono<jwtEnv>();

app.get(async () => {
   return new Response(
      Array.from(await getVocabulary())
         .sort()
         .join("\n"),
      { headers: { version: `${version}` } },
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
   });

export default app;
