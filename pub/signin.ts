import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { taskDB, collectionUser } from "../lib/mongo.ts";
import { twilio } from "../lib/twilio.ts";
import { jwt } from "../lib/jwt.ts";

const maxAge = 180 * 24 * 60 * 60;
const app = new Hono();

app.get(async (c) => {
    const { name, code } = c.req.query();
    if (!name || !code) return emptyResponse(STATUS_CODE.BadRequest);
    const user = await collectionUser.findOne({ name });
    if (!user) return emptyResponse(STATUS_CODE.NotFound);
    const result = await twilio.createVerificationCheck(user.phone, code);
    if (result.status != 'approved') return emptyResponse(STATUS_CODE.Unauthorized);
    await collectionUser.updateOne({ name }, { $set: { confirmed: true } });
    const collectionNames = (await taskDB.collections()).map(conn => conn.collectionName);
    if (!collectionNames.includes(name)) {
        const collection = await taskDB.createCollection(name);
        await collection.createIndex({ word: 1 }, { unique: true });
        await collection.createIndex({ last: 1 });
    }
    console.log(`API 'login' GET ${name}`);
    return c.json({ auth: await jwt.createToken(maxAge, { aud: user?.name }) });
});

export default app;