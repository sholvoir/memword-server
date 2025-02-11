import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { IDict } from "../lib/idict.ts";
import { jwtEnv } from "../lib/env.ts";
import { collectionDict } from "../lib/mongo.ts";

const app = new Hono<jwtEnv>();

app.put(async (c) => {
    const clientDict = await c.req.json() as IDict;
    if (!clientDict) return emptyResponse(STATUS_CODE.BadRequest);
    delete clientDict._id;
    const result = await collectionDict.replaceOne({ word: clientDict.word }, clientDict);
    if (!result.acknowledged) return emptyResponse(STATUS_CODE.InternalServerError);
    console.log(`API word PUT ${clientDict.word}`);
    return emptyResponse();
}).delete(async (c) => {
    const word = c.req.query('q');
    if (!word) return emptyResponse(STATUS_CODE.BadRequest);
    const result = await collectionDict.deleteOne({ word });
    if (!result.deletedCount) return emptyResponse(STATUS_CODE.NotFound);
    return emptyResponse();
});

export default app;