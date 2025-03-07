// deno-lint-ignore-file no-explicit-any
import { Hono } from "hono";
import { jwtEnv } from "../lib/env.ts";
import { collectionIssue } from "../lib/mongo.ts";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";

const app = new Hono<jwtEnv>();

app.get(async (c) => {
    const issues = [];
    for await (const issue of collectionIssue.find())
        issues.push(issue);
    console.log(`API issue GET successed`);
    return c.json(issues);
}).delete(async c => {
    const id = c.req.query('id');
    if (!id) return emptyResponse(STATUS_CODE.BadRequest);
    const result = await collectionIssue.deleteOne({_id: id as any})
    if (!result.acknowledged) return c.json(result, STATUS_CODE.InternalServerError);
    else return c.json(result);
});

export default app;