import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import fill from "../lib/oxford.ts";

const app = new Hono();

app.get(async (c) => {
   const word = c.req.query("q");
   if (!word) return emptyResponse(STATUS_CODE.BadRequest);
   const entry = await fill(word, {});
   console.log(`API 'definition' GET id: ${word}`);
   return c.json(entry);
});

export default app;
