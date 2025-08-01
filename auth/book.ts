// deno-lint-ignore-file no-cond-assign
import { Hono } from "hono";
import { B2_BUCKET, now } from "@sholvoir/memword-common/common";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { collectionBook } from "../lib/mongo.ts";
import * as spellCheck from '../lib/spell-check.ts';
import { minio } from "../lib/minio.ts";
import { jwtEnv } from "../lib/env.ts";

const app = new Hono<jwtEnv>();
app.post(async (c) => {
    const username = c.get('username');
    const bname = c.req.query('name');
    const disc = c.req.query('disc');
    if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
    const bid = `${username}/${bname}`;
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    const version = now();
    const [words, replaces] = await spellCheck.check(text.split('\n'));
    if (Object.keys(replaces).length) {
        console.log(`API book POST ${bid}, spell check failed.`);
        return c.json(replaces, STATUS_CODE.NotAcceptable);
    }
    const wl = await collectionBook.findOne({ bid });
    if (wl) {
        const stream = await minio.getObject(B2_BUCKET, `${bid}.txt`);
        const text = await new Response(stream).text();
        for (let line of text.split('\n')) if (line = line.trim()) words.add(line);
    }
    await minio.putObject(B2_BUCKET, `${bid}.txt`, Array.from(words).sort().join('\n'), 'text/plain');
    if (wl) await collectionBook.updateOne({ bid }, { $set: disc ? { version, disc } : { version } });
    else await collectionBook.insertOne(disc ? { bid, version: version, disc } : { bid, version: version });
    console.log(`API book POST ${bid}, successed.`);
    return c.json({ bid, version, disc });
}).put(async (c) => {
    const username = c.get('username');
    const bname = c.req.query('name');
    const disc = c.req.query('disc');
    if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
    const bid = `${username}/${bname}`;
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    const version = now();
    const [words, replaces] = await spellCheck.check(text.split('\n'));
    if (Object.keys(replaces).length) {
        console.log(`API book PUT ${bid}, spell check failed.`);
        return c.json(replaces, STATUS_CODE.NotAcceptable);
    }
    const wl = await collectionBook.findOne({ bid });
    await minio.putObject(B2_BUCKET, `${bid}.txt`, Array.from(words).sort().join('\n'), 'text/plain');
    if (wl) await collectionBook.updateOne({ bid }, { $set: disc ? { version, disc } : { version } });
    else await collectionBook.insertOne(disc ? { bid, version, disc } : { bid, version });
    console.log(`API book PUT ${bid}, successed.`);
    return c.json({ bid, version, disc });
}).delete(async c => {
    const username = c.get('username');
    const wlname = c.req.query('name');
    if (!wlname) return emptyResponse(STATUS_CODE.BadRequest);
    const bid = `${username}/${wlname}`;
    const wl = await collectionBook.findOne({ bid });
    if (!wl) return emptyResponse(STATUS_CODE.NotFound);
    const result = await collectionBook.deleteOne({ bid });
    if (!result.acknowledged) return c.json(result, STATUS_CODE.Conflict);
    await minio.removeObject(B2_BUCKET, `${bid}.txt`);
    console.log(`API book DELETE ${username}/${wlname}, successed.`);
    return emptyResponse();
});

export default app;