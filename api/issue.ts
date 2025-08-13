import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { jwtEnv } from "../lib/env.ts";
import { collectionIssue } from "../lib/mongo.ts";
import { ObjectId } from "mongodb";
import user from "../mid/user.ts";
import auth from "../mid/auth.ts";
import admin from "../mid/admin.ts";

const app = new Hono<jwtEnv>();

app.get(user, auth, admin, async (c) => {
    const issues = [];
    for await (const issue of collectionIssue.find())
        issues.push(issue);
    console.log(`API issue GET successed`);
    return c.json(issues);
}).post(user, auth, async (c) => {
    const reporter = c.get('username');
    const issue = (await c.req.json()).issue;
    if (!issue) return emptyResponse(STATUS_CODE.BadRequest);
    const result = await collectionIssue.insertOne({reporter, issue});
    if (!result.acknowledged)
        return c.json(result, STATUS_CODE.InternalServerError);
    console.log(`API issue POST ${reporter} ${issue}`);
    return c.json(result);
}).delete(user, auth, admin, async c => {
    const id = c.req.query('id');
    if (!id) return emptyResponse(STATUS_CODE.BadRequest);
    const result = await collectionIssue.deleteOne({_id: new ObjectId(id)})
    if (!result.acknowledged) return c.json(result, STATUS_CODE.InternalServerError);
    else return c.json(result);
});

export default app;