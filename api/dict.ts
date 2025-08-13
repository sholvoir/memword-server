import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { IDict } from "@sholvoir/memword-common/idict";
import { now } from "@sholvoir/memword-common/common";
import { jwtEnv } from "../lib/env.ts";
import { collectionDict } from "../lib/mongo.ts";
import { getVocabulary } from "../lib/spell-check.ts";
import fill from '../lib/fill-dict.ts';
import user from "../mid/user.ts";
import auth from "../mid/auth.ts";
import admin from "../mid/admin.ts";

const app = new Hono<jwtEnv>();

app.get(async (c) => {
    const word = c.req.query('q');
    if (!word) return emptyResponse(STATUS_CODE.BadRequest);
    const dict = await collectionDict.findOne({ word });
    if (dict) return c.json(dict)
    const entry = await fill(word, {});
    const vocab = await getVocabulary();
    const ndict: IDict = { word, entries: [entry], version: now() };
    if (vocab.has(word)) await collectionDict.insertOne(ndict);
    console.log(`API 'dict' GET word: ${word}`);
    return c.json(ndict);
}).put(user, auth, admin, async (c) => {
    const clientDict = await c.req.json() as IDict;
    if (!clientDict) return emptyResponse(STATUS_CODE.BadRequest);
    delete clientDict._id;
    clientDict.version = now();
    const result = await collectionDict.replaceOne({ word: clientDict.word }, clientDict, { upsert: true });
    if (!result.acknowledged) return emptyResponse(STATUS_CODE.InternalServerError);
    console.log(`API dict PUT ${clientDict.word}`);
    return emptyResponse();
}).delete(user, auth, admin, async (c) => {
    const word = c.req.query('q');
    if (!word) return emptyResponse(STATUS_CODE.BadRequest);
    const result = await collectionDict.deleteOne({ word });
    if (!result.deletedCount) return emptyResponse(STATUS_CODE.NotFound);
    console.log(`API dict DELETE ${word}`);
    return emptyResponse();
});

export default app;