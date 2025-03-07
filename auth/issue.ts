import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";
import { collectionIssue } from "../lib/mongo.ts";

const app = new Hono<jwtEnv>()

app.post(async (c) => {
    const reporter = c.get('username');
    const issue = (await c.req.json()).issue;
    if (!issue) return emptyResponse(STATUS_CODE.BadRequest);
    const result = await collectionIssue.insertOne({reporter, issue});
    if (!result.acknowledged)
        return c.json(result, STATUS_CODE.InternalServerError);
    console.log(`API issue POST ${reporter} ${issue}`);
    return c.json(result);
});

export default app;