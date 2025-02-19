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
        {wlid: { $regex: new RegExp(`^${username}/.+$`)}},
        { _id: 0 }
    )) result.push(wl);
    return c.json(result);
}).post(async (c) => {
    const username = c.get('username');
    const wlname = c.req.query('name');
    if (!wlname) return emptyResponse(STATUS_CODE.BadRequest);
    const wlid = `${username}/${wlname}`;
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    const [words, replaces] = await spellCheck.check(text.split('\n'));
    if (Object.keys(replaces).length) {
        console.log(`API 'wordlist' POST ${username}/${wlname}, spell check failed.`);
        return c.json(replaces, STATUS_CODE.NotAcceptable);
    }
    const wordlist = await collectionWordList.findOne({ wlid });
    const newVersion = wordlist ? versionpp(wordlist.version) : '0.0.1';
    await minio.putObject(B2_BUCKET, `${wlid}-${newVersion}.txt`,
        Array.from(words).sort().join('\n'), 'text/plain');
    if (wordlist) {
        await collectionWordList.updateOne({ wlid }, { $set: { version: newVersion } });
        await minio.removeObject(B2_BUCKET, `${wlid}-${wordlist.version}.txt`);
    } else await collectionWordList.insertOne({ wlid, version: newVersion });
    vocabulary.add(words);
    console.log(`API '/wordlist' POST ${username}/${wlname}, successed.`);
    return emptyResponse();
});

export default app;