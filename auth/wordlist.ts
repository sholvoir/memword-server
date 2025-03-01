import { Hono } from "hono";
import { B2_BUCKET } from "../lib/common.ts";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { versionpp } from "@sholvoir/generic/versionpp";
import { collectionWordList } from "../lib/mongo.ts";
import * as vocabulary from '../lib/vocabulary.ts';
import * as spellCheck from '../lib/spell-check.ts';
import { minio } from "../lib/minio.ts";
import { jwtEnv } from "../lib/env.ts";

const app = new Hono<jwtEnv>();
app.get(async c => {
    const username = c.get('username');
    const result = [];
    for await (const wl of collectionWordList.find(
        { wlid: { $regex: new RegExp(`^${username}/.+$`) } }
    )) result.push(wl);
    return c.json(result);
}).post(async (c) => {
    const username = c.get('username');
    const wlname = c.req.query('name');
    const disc = c.req.query('disc');
    if (!wlname) return emptyResponse(STATUS_CODE.BadRequest);
    const wlid = `${username}/${wlname}`;
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    const [words, replaces] = await spellCheck.check(text.split('\n'));
    if (Object.keys(replaces).length) {
        console.log(`API 'wordlist' POST ${username}/${wlname}, spell check failed.`);
        return c.json(replaces, STATUS_CODE.NotAcceptable);
    }
    const wl = await collectionWordList.findOne({ wlid });
    const newVersion = wl ? versionpp(wl.version) : '0.0.1';
    await minio.putObject(B2_BUCKET, `${wlid}-${newVersion}.txt`,
        Array.from(words).sort().join('\n'), 'text/plain');
    if (wl) {
        await collectionWordList.updateOne({ wlid }, { $set: { version: newVersion, disc } });
        await minio.removeObject(B2_BUCKET, `${wlid}-${wl.version}.txt`);
    } else await collectionWordList.insertOne({ wlid, version: newVersion });
    vocabulary.add(words);
    console.log(`API '/wordlist' POST ${username}/${wlname}, successed.`);
    return c.json({ wlid, version: newVersion, disc });
}).delete(async c => {
    const username = c.get('username');
    const wlname = c.req.query('name');
    if (!wlname) return emptyResponse(STATUS_CODE.BadRequest);
    const wlid = `${username}/${wlname}`;
    const result = await collectionWordList.deleteOne({ wlid });
    if (!result.acknowledged) return c.json(result, STATUS_CODE.Conflict);
    return emptyResponse();
});

export default app;