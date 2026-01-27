import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { getDict } from "../lib/dict.ts";

const app = new Hono();

app.get(async (c) => {
   const word = c.req.query("q");
   if (!word) return emptyResponse(STATUS_CODE.BadRequest);
   const dict = await getDict(word);
   console.log(`API 'definition' GET id: ${word}`);
   return c.json(dict?.entries?.[0]);
});

export default app;
