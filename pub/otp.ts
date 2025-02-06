import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { twilio } from "../lib/twilio.ts";
import { collectionUser } from "../lib/mongo.ts";
import { now } from "../lib/common.ts";
import { fail } from "../lib/fail.ts";

const app = new Hono();

app.get(async (c) => {
    try {
        const { name } = c.req.query();
        if (!name)
            return emptyResponse(STATUS_CODE.BadRequest);
        const user = await collectionUser.findOne({name});
        if (!user)
            return c.json(fail('User Not Found'), STATUS_CODE.NotFound);
        if (!user.phone)
            return c.json(fail('No User Phone Found'), STATUS_CODE.FailedDependency);
        if (user.lastOtp + 5*60 < now())
            return c.json(fail('Too Frequency to get OTP'), STATUS_CODE.TooEarly);
        const result = await twilio.createVerification(user.phone);
        if (!result.valid)
            return c.json(fail('Wrong Phone Number'), STATUS_CODE.BadRequest);
        console.log(`API 'otp' GET name: ${name}, phone: ${user.phone}`);
        return emptyResponse();
    } catch (e) {
        console.error(e);
        throw new HTTPException(STATUS_CODE.InternalServerError);
    }
});

export default app;