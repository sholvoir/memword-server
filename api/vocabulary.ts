import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";
import { addToVocabulary } from "../lib/spell-check.ts";

const app = new Hono<jwtEnv>();

app.post(async (c) => {
    const text = await c.req.text();
    if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
    addToVocabulary(text.split('/n'));
    console.log(`API vocabulary POST successed`);
    return emptyResponse();
});

export default app;