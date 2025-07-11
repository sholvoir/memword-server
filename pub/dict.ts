import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { collectionDict } from "../lib/mongo.ts";
import { getVocabulary } from "../lib/spell-check.ts";
import { now } from "../lib/common.ts";
import fill from '../lib/fill-dict.ts';

const app = new Hono();

app.get(async (c) => {
    const word = c.req.query('q');
    if (!word) return emptyResponse(STATUS_CODE.BadRequest);
    const dict = await collectionDict.findOne({ word });
    if (dict) return c.json(dict)
    const card = await fill(word, {});
    const vocab = await getVocabulary();
    const ndict = { word, cards: [card], version: now() };
    if (vocab.has(word)) await collectionDict.insertOne(ndict);
    console.log(`API 'dict' GET word: ${word}`);
    return c.json(ndict);
});

export default app;