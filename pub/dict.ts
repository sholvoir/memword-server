import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { IDict } from "../lib/idict.ts";
import fill from '../lib/fill-dict.ts';
import * as vocabulary from '../lib/vocabulary.ts';
import { collectionDict } from "../lib/mongo.ts";

const app = new Hono();

app.get(async (c) => {
    try {
        const wordN = c.req.query('q');
        if (!wordN) return emptyResponse(STATUS_CODE.BadRequest);
        const word = wordN.split('_')[0];
        if (!word) return emptyResponse(STATUS_CODE.BadRequest);
        const dict = await collectionDict.findOne({word: wordN});
        if (dict) return c.json(dict)
        const ndict: IDict = {word};
        await fill(ndict);
        const data = await vocabulary.get();
        if (data.has(wordN)) {
            ndict.word = wordN;
            await collectionDict.insertOne(ndict)
        }
        return c.json(ndict)
    } catch (e) {
        console.error(e);
        return emptyResponse(STATUS_CODE.InternalServerError);
    }
});

export default app;