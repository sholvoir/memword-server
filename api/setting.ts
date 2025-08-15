import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { ISetting } from "@sholvoir/memword-common/isetting";
import { jwtEnv } from "../lib/env.ts";
import { collectionUser } from "../lib/mongo.ts";
import user from "../mid/user.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();

app.post(user, auth, async (c) => {
    const name = c.get('username');
    const user = await collectionUser.findOne({ name });
    if (!user) return emptyResponse(STATUS_CODE.NotFound);
    const serverSetting = user.setting;
    const clientSetting = await c.req.json() as ISetting;
    if (serverSetting.version >= clientSetting.version)
        return c.json(serverSetting);
    await collectionUser.updateOne({ _id: user._id }, { $set: { setting: clientSetting } })
    console.log(`API setting POST ${name}`);
    return c.json(clientSetting);
});

export default app;