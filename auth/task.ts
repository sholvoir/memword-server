// deno-lint-ignore-file no-explicit-any
import { emptyResponse, jsonResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { Int32 } from "mongodb";
import { ITask } from "../lib/itask.ts";
import { getCollectionTask } from "../lib/mongo.ts";
import { Hono } from "hono";
import { jwtEnv } from "../lib/env.ts";

const app = new Hono<jwtEnv>();

app.post(async (c) => {
    const lastgt = +(c.req.query('lastgt')!);
    if (isNaN(lastgt)) return emptyResponse(STATUS_CODE.BadRequest);
    const username = c.get('username');
    const clientTasks: Array<ITask> = await c.req.json();
    const serverTasks: ITask[] = [];
    const collectionTask = getCollectionTask(username);
    const cursor = collectionTask.find({ last: { $gte: lastgt } });
    for await (const task of cursor) serverTasks.push(task as any);
    for (const ctask of clientTasks) {
        const filter = { word: ctask.word };
        delete ctask._id;
        const otask = (await collectionTask.findOne(filter)) as ITask | null;
        if (!otask) await collectionTask.insertOne(ctask as any);
        else if (ctask.last > otask.last) {
            const $set = { last: new Int32(ctask.last), next: new Int32(ctask.next), level: new Int32(ctask.level) } as any;
            await collectionTask.updateOne(filter, { $set });
        }
    }
    console.log(`API task POST ${username} ${lastgt} with tasks ${clientTasks.length}, return ${serverTasks.length}.`);
    return jsonResponse(serverTasks);
}).delete(async (c) => {
    const username = c.get('username');
    const words: Array<string> = await c.req.json();
    if (!Array.isArray(words)) return emptyResponse(STATUS_CODE.BadRequest);
    const deleteResult = await getCollectionTask(username).deleteMany({ word: { $in: words } });
    console.log(`API task DELETE ${username} with tasks ${deleteResult.deletedCount}.`);
    return jsonResponse(deleteResult);
})

export default app;