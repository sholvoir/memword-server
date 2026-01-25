import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { maxAge } from "@sholvoir/memword-common/common";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { jwt } from "../lib/jwt.ts";
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
   const token = await jwt.createToken(maxAge, { aud: user?.name });
   setCookie(c, "auth", token, {
      maxAge,
      domain: ".micinfotech.com",
      path: "/",
      secure: true,
      httpOnly: true,
   });
   return c.json({ auth: token });
});

export default app;
