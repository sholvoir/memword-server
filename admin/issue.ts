import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";
import { collectionIssue } from "../lib/mongo.ts";
import { ObjectId } from "mongodb";

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
    const result = await collectionIssue.deleteOne({_id: new ObjectId(id)})
    if (!result.acknowledged) return c.json(result, STATUS_CODE.InternalServerError);
    else return c.json(result);
});

export default app;