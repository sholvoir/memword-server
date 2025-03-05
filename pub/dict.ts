import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { collectionDict } from "../lib/mongo.ts";
import { getVocabulary } from "../lib/spell-check.ts";
import fill from '../lib/fill-dict.ts';

const app = new Hono();

app.get(async (c) => {
    const word = c.req.query('q');
    if (!word) return emptyResponse(STATUS_CODE.BadRequest);
    const dict = await collectionDict.findOne({ word });
    if (dict) return c.json(dict)
    const card = await fill(word, {});
    const vocab = await getVocabulary();
    const ndict = { word, cards: [card] };
    if (vocab.has(word)) await collectionDict.insertOne(ndict);
    return c.json(ndict);
});

export default app;