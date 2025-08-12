import { Hono } from "hono";
import jwt from '../mid/jwt.ts';
import admin from '../mid/admin.ts';

import { collectionDict, collectionIssue } from "../lib/mongo.ts";
import { IIssue } from "@sholvoir/memword-common/iissue";
import { InsertManyResult } from "mongodb";

const app = new Hono();

app.get(jwt, admin, async (c) => {
    const result: InsertManyResult<IIssue> = {
        acknowledged: true,
        insertedIds: {},
        insertedCount: 0
    }
    const cursor = collectionDict.find({'entries.0.meanings.ecdict': { $exists: true }});
    for await (const dict of cursor) {
        const r = await collectionIssue.insertOne({reporter: "hua", issue: dict.word});
        result.insertedIds[result.insertedCount++] = r.insertedId;
    }
    console.log(`API ecdict as issue GET ${result.insertedCount}`);
    return c.json(result);
})

export default app;