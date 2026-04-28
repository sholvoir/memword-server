import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import type { Hono } from "hono";
import { maxAge } from "../lib/common.ts";
import { clearAuthCookie, setAuthCookie } from "../lib/cookie.ts";
import type { jwtEnv } from "../lib/env.ts";
import { newUser } from "../lib/iuser.ts";
import { collectionUser, initForNewUser } from "../lib/mongo.ts";
import { twilio } from "../lib/twilio.ts";
import auth from "../mid/auth.ts";

const sign = (app: Hono<jwtEnv>) => {
   app.get("/signup", async (c) => {
      const { phone, name } = c.req.query();
      if (!phone || !name) return emptyResponse(STATUS_CODE.BadRequest);
      const user = await collectionUser.findOne({ name });
      if (user?.confirmed) return emptyResponse(STATUS_CODE.Conflict);
      const result = user
         ? await collectionUser.updateOne(
              { name },
              { $set: { phone, confirmed: false, lastOtp: 0 } },
           )
         : await collectionUser.insertOne(newUser(name, phone));
      if (!result.acknowledged) return emptyResponse(STATUS_CODE.Conflict);
      setTimeout(
         () => collectionUser.deleteOne({ name, confirmed: false }),
         5 * 60 * 1000,
      );
      console.log(`API 'signup' GET ${name}`);
      return emptyResponse();
   });
   app.get("/otp", async (c) => {
      const name = c.req.query("name");
      if (!name) return emptyResponse(STATUS_CODE.BadRequest);
      const user = await collectionUser.findOne({ name });
      if (!user) return emptyResponse(STATUS_CODE.NotFound);
      if (!user.phone) return emptyResponse(STATUS_CODE.FailedDependency);
      const time = Date.now();
      if (user.lastOtp + 5 * 60 > time)
         return emptyResponse(STATUS_CODE.TooEarly);
      await twilio.createVerification(user.phone);
      collectionUser.updateOne({ name }, { $set: { lastOtp: time } });
      console.log(`API 'otp' GET name: ${name}, phone: ${user.phone}`);
      return emptyResponse();
   });
   app.get("/signin", async (c) => {
      const { name, code } = c.req.query();
      if (!name || !code) return emptyResponse(STATUS_CODE.BadRequest);
      const user = await collectionUser.findOne({ name });
      if (!user) return emptyResponse(STATUS_CODE.NotFound);
      const result = await twilio.createVerificationCheck(user.phone, code);
      if (result.status !== "approved")
         return emptyResponse(STATUS_CODE.Unauthorized);
      await collectionUser.updateOne({ name }, { $set: { confirmed: true } });
      await initForNewUser(name);
      console.log(`API 'signin' GET ${name}`);
      await setAuthCookie(c, name);
      return c.json({ name, expired: Date.now() + maxAge });
   });
   app.get("/renew", auth, async (c) => {
      const name = c.get("username");
      console.log(`API renew GET ${name}`);
      await setAuthCookie(c, name);
      return c.json({ name, expired: Date.now() + maxAge });
   });
   app.get("/signout", auth, (c) => {
      clearAuthCookie(c);
      console.log(`API signout GET`);
      return c.newResponse(null, { status: 204 });
   });
};

export default sign;
