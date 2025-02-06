import { Hono } from "hono";
import { B2_BUCKET } from "../lib/common.ts";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { versionpp } from "@sholvoir/generic/versionpp";
import { collectionWordList } from "../lib/mongo.ts";
import { minio } from "../lib/minio.ts";
import { jwtEnv } from "../lib/env.ts";

const app = new Hono<jwtEnv>();

app.post(async (c) => {
    const {name} = c.req.query();
    if (!name) return emptyResponse(STATUS_CODE.BadRequest);
    const wlid = `system/${name}`;
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    const wl = await collectionWordList.findOne({ wlid });
    const newVersion = wl ? versionpp(wl.version) : '0.0.1';
    const result = await minio.putObject(B2_BUCKET, `${wlid}-${newVersion}.txt`, text, 'text/plain');
    console.log(result);
    if (wl) {
        await minio.removeObject(B2_BUCKET, `${wlid}-${wl.version}.txt`);
        await collectionWordList.updateOne({ wlid }, { $set: { version: newVersion } });
    } else {
        await collectionWordList.insertOne({ wlid, version: newVersion });
    }
    console.log(`API '/wordlist' POST ${wlid}-${newVersion}, successed.`);
    return emptyResponse();
});

export default app;