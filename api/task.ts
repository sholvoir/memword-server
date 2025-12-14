// deno-lint-ignore-file no-explicit-any
import { Collection, Int32 } from "mongodb";
import { emptyResponse, jsonResponse, STATUS_CODE } from '@sholvoir/generic/http';
import { ITask } from "@sholvoir/memword-common/itask";
import { getCollectionTask } from "../lib/mongo.ts";
import { Hono } from "hono";
import { jwtEnv } from "../lib/env.ts";
import user from "../mid/user.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();
const tasksMap = new Map<string, Map<string, ITask>>();
const syncTasks = async (username: string, collectionTask: Collection<ITask>) => {
    let serverTasks = tasksMap.get(username);
    if (!serverTasks) {
        serverTasks = new Map<string, ITask>();
        tasksMap.set(username, serverTasks);
        for await (const task of collectionTask.find())
            serverTasks.set(task.word, task);
    }
    return serverTasks;
}

app.post(user, auth, async (c) => {
    const username = c.get('username');
    const collectionTask = getCollectionTask(username);
    const serverTasks = await syncTasks(username, collectionTask);
    const clientTasks: Array<ITask> = await c.req.json();
    for (const ctask of clientTasks) {
        delete ctask._id;
        if (serverTasks.has(ctask.word)) {
            const stask = serverTasks.get(ctask.word)!;
            if (ctask.last > stask.last) {
                serverTasks.set(ctask.word, ctask);
                const $set = { last: new Int32(ctask.last), next: new Int32(ctask.next), level: new Int32(ctask.level) } as any;
                await collectionTask.updateOne({ word: ctask.word }, { $set });
            }
        } else {
            serverTasks.set(ctask.word, ctask);
            await collectionTask.insertOne(ctask);
        }
    }
    console.log(`API task POST ${username} with tasks ${clientTasks.length}, return ${serverTasks.size}.`);
    return jsonResponse(Array.from(serverTasks.values().map(task=>(delete task._id, task))));
}).delete(user, auth, async (c) => {
    const username = c.get('username');
    const words: Array<string> = await c.req.json();
    const collectionTask = getCollectionTask(username);
    const serverTasks = await syncTasks(username, collectionTask);
    if (!Array.isArray(words)) return emptyResponse(STATUS_CODE.BadRequest);
    for (const word of words) serverTasks.delete(word);
    const deleteResult = await collectionTask.deleteMany({ word: { $in: words } });
    console.log(`API task DELETE ${username} with tasks ${deleteResult.deletedCount}.`);
    return jsonResponse(deleteResult);
})

export default app;