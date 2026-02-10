import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { setAuthCookie } from "../lib/cookie.ts";
import { collectionUser, newTaskCollection } from "../lib/mongo.ts";
import { twilio } from "../lib/twilio.ts";

const app = new Hono();

app.get(async (c) => {
   const { name, code } = c.req.query();
   if (!name || !code) return emptyResponse(STATUS_CODE.BadRequest);
   const user = await collectionUser.findOne({ name });
   if (!user) return emptyResponse(STATUS_CODE.NotFound);
   const result = await twilio.createVerificationCheck(user.phone, code);
   if (result.status !== "approved")
      return emptyResponse(STATUS_CODE.Unauthorized);
   await collectionUser.updateOne({ name }, { $set: { confirmed: true } });
   await newTaskCollection(name);
   console.log(`API 'signin' GET ${name}`);
   await setAuthCookie(c, name);
   return emptyResponse();
});

export default app;
