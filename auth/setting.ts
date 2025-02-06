import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { ISetting } from "../lib/isetting.ts";
import { Hono } from "hono";
import { jwtEnv } from "../lib/env.ts";
import { collectionUser } from "../lib/mongo.ts";
import { fail } from "../lib/fail.ts";

const app = new Hono<jwtEnv>();

app.post(async (c) => {
    try {
        const name = c.get('username');
        const user = await collectionUser.findOne({name});
        if (!user) return c.json(fail('Pass Auth but no user'), STATUS_CODE.InternalServerError);
        const serverSetting = user.setting;
        const clientSetting = await c.req.json() as ISetting;
        if (serverSetting.version > clientSetting.version)
            return c.json(serverSetting);
        await collectionUser.updateOne({_id: user._id}, {$set: { setting: clientSetting }})
        console.log(`API '/setting' POST ${name}`);
        return c.json(clientSetting);
    } catch { return emptyResponse(STATUS_CODE.InternalServerError); }
});

export default app;