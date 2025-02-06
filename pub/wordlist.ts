import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { collectionWordList } from "../lib/mongo.ts";

const app = new Hono();

app.get(async (c) => {
    const wlid = c.req.query('wlid');
    if (!wlid) return emptyResponse(STATUS_CODE.BadRequest);
    const wl = await collectionWordList.findOne({ wlid });
    if (!wl) return emptyResponse(STATUS_CODE.NotFound);
    console.log(`API wordlist GET ${wlid}`);
    return c.json(wl);
}).post(async (c) => {
    const wlids = await c.req.json() as Array<string>;
    if (!Array.isArray(wlids))
        return emptyResponse(STATUS_CODE.BadRequest);
    const wls = [];
    for await (const wl of collectionWordList.find({ wlid: { $in: wlids } }))
        wls.push(wl);
    console.log(`API wordlist POST`);
    return c.json(wls);
});

export default app;