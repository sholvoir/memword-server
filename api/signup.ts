import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { newUser } from "@sholvoir/memword-common/iuser";
import { collectionUser } from "../lib/mongo.ts";

const app = new Hono();

app.get(async (c) => {
    const {phone, name} = c.req.query();
    if (!phone || !name) return emptyResponse(STATUS_CODE.BadRequest);
    const user = await collectionUser.findOne({ name });
    if (user?.confirmed) return emptyResponse(STATUS_CODE.Conflict);
    const result = user ?
        await collectionUser.updateOne({ name }, { $set: { phone, confirmed: false, lastOtp: 0 } }) :
        await collectionUser.insertOne(newUser(name, phone));
    if (!result.acknowledged) return emptyResponse(STATUS_CODE.Conflict);
    setTimeout(() => collectionUser.deleteOne({ name, confirmed: false }), 5 * 60 * 1000);
    console.log(`API 'signup' GET ${name}`);
    return emptyResponse();
});

export default app;