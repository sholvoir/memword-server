// deno-lint-ignore-file no-explicit-any
import { Int32 } from "mongodb";
import { emptyResponse, jsonResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { ITask } from "@sholvoir/memword-common/itask";
import { getCollectionTask } from "../lib/mongo.ts";
import { Hono } from "hono";
import { jwtEnv } from "../lib/env.ts";
import user from "../mid/user.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();
const tasks = new Map<string, ITask>();

app.post(user, auth, async (c) => {
    const username = c.get('username');
    const collectionTask = getCollectionTask(username);
    if (tasks.size == 0)
        for await (const task of collectionTask.find())
            tasks.set(task.word, task);
    const clientTasks: Array<ITask> = await c.req.json();
    for (const ctask of clientTasks) {
        delete ctask._id;
        if (tasks.has(ctask.word)) {
            const stask = tasks.get(ctask.word)!;
            if (ctask.last > stask.last) {
                tasks.set(ctask.word, ctask);
                const $set = { last: new Int32(ctask.last), next: new Int32(ctask.next), level: new Int32(ctask.level) } as any;
                await collectionTask.updateOne({ word: ctask.word }, { $set });
            }
        } else {
            tasks.set(ctask.word, ctask);
            await collectionTask.insertOne(ctask);
        }
    }
    console.log(`API task POST ${username} with tasks ${clientTasks.length}, return ${tasks.size}.`);
    return jsonResponse(Array.from(tasks.values().map(task=>(delete task._id, task))));
}).delete(user, auth, async (c) => {
    const username = c.get('username');
    const words: Array<string> = await c.req.json();
    if (!Array.isArray(words)) return emptyResponse(STATUS_CODE.BadRequest);
    for (const word of words) tasks.delete(word);
    const deleteResult = await getCollectionTask(username).deleteMany({ word: { $in: words } });
    console.log(`API task DELETE ${username} with tasks ${deleteResult.deletedCount}.`);
    return jsonResponse(deleteResult);
})

export default app;