import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { IDict } from "../lib/idict.ts";
import fill from '../lib/fill-dict.ts';
import * as vocabulary from '../lib/vocabulary.ts';
import { collectionDict } from "../lib/mongo.ts";

const app = new Hono();

app.get(async (c) => {
    const word = c.req.query('q');
    if (!word) return emptyResponse(STATUS_CODE.BadRequest);
    const dict = await collectionDict.findOne({ word });
    if (dict) return c.json(dict)
    const ndict: IDict = { word };
    await fill(ndict);
    const vocab = await vocabulary.get();
    if (vocab.has(word)) {
        ndict.word = word;
        await collectionDict.insertOne(ndict)
    }
    return c.json(ndict)
});

export default app;