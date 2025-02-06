import { Hono } from 'hono';
import { STATUS_CODE } from "@sholvoir/generic/http";
import { twilio } from "../lib/twilio.ts";
import { jwt } from "../lib/jwt.ts";
import { HTTPException } from "hono/http-exception";
import { collectionUser, taskDB } from "../lib/mongo.ts";

const maxAge = 180 * 24 * 60 * 60;
const app = new Hono();

app.get(async (c) => {
    try {
        const { phone, code } = c.req.query();
        const result = await twilio.createVerificationCheck(phone, code);
        if (result.status != 'approved')
        return c.json(result, STATUS_CODE.Unauthorized);
        const collectionNames = (await taskDB.collections()).map(conn => conn.collectionName);
        if (!collectionNames.includes(phone)) {
            const collection = await taskDB.createCollection(phone);
            await collection.createIndex({ word: 1 }, { unique: true });
            await collection.createIndex({ last: 1 });
        }
        const user = await collectionUser.findOneAndUpdate({phone}, {$set: { confirmed: true}});
        console.log(`API 'login' GET ${phone}`);
        return c.json({auth: await jwt.createToken(maxAge, { aud: user?.name })});
    } catch (e) {
        console.error(e);
        throw new HTTPException(STATUS_CODE.Unauthorized);
    }
});

export default app;