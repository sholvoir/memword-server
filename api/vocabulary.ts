import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";
import { addToVocabulary, getVocabulary } from "../lib/spell-check.ts";
import user from './mid/user.ts';
import auth from './mid/auth.ts';
import admin from './mid/admin.ts';

const app = new Hono<jwtEnv>();

app.get(async c => c.json(Array.from(await getVocabulary()).sort()))
.post(user, auth, admin, async (c) => {
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    addToVocabulary(text.split('/n'));
    console.log(`API vocabulary POST successed`);
    return emptyResponse();
});

export default app;