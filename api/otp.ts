import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { now } from "@sholvoir/memword-common/common";
import { twilio } from "../lib/twilio.ts";
import { collectionUser } from "../lib/mongo.ts";

const app = new Hono();

app.get(async (c) => {
    const name = c.req.query('name');
    if (!name) return emptyResponse(STATUS_CODE.BadRequest);
    const user = await collectionUser.findOne({ name });
    if (!user) return emptyResponse(STATUS_CODE.NotFound);
    if (!user.phone) return emptyResponse(STATUS_CODE.FailedDependency);
    const time = now();
    if (user.lastOtp + 5 * 60 > time) return emptyResponse(STATUS_CODE.TooEarly);
    await twilio.createVerification(user.phone);
    collectionUser.updateOne({ name }, { $set: { lastOtp: time } });
    console.log(`API 'otp' GET name: ${name}, phone: ${user.phone}`);
    return emptyResponse();
});

export default app;