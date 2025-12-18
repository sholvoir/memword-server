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
    if (serverTasks) return serverTasks;
    serverTasks = new Map<string, ITask>();
    tasksMap.set(username, serverTasks);
    for await (const task of collectionTask.find())
        serverTasks.set(task.word, task);
    return serverTasks;
}
const upsertTask = async (ctask: ITask, serverTasks: Map<string, ITask>, collectionTask: Collection<ITask>) => {
    delete ctask._id;
    const stask = serverTasks.get(ctask.word);
    if (!stask) {
        serverTasks.set(ctask.word, ctask);
        await collectionTask.insertOne(ctask);
    } else if (ctask.last > stask.last) {
        serverTasks.set(ctask.word, ctask);
        const $set = { last: new Int32(ctask.last), next: new Int32(ctask.next), level: new Int32(ctask.level) } as any;
        await collectionTask.updateOne({ word: ctask.word }, { $set });
    }
}

app.post(user, auth, async (c) => {
    const username = c.get('username');
    const collectionTask = getCollectionTask(username);
    const serverTasks = await syncTasks(username, collectionTask);
    const clientTasks: Array<ITask> = await c.req.json();
    if (!clientTasks || !Array.isArray(clientTasks)) return emptyResponse(STATUS_CODE.BadRequest);
    for (const ctask of clientTasks) upsertTask(ctask, serverTasks, collectionTask);
    console.log(`API task POST ${username} with tasks ${clientTasks.length}, return ${serverTasks.size}.`);
    return jsonResponse(Array.from(serverTasks.values().map(task => (delete task._id, task))));
}).delete(user, auth, async (c) => {
    const username = c.get('username');
    const collectionTask = getCollectionTask(username);
    const serverTasks = await syncTasks(username, collectionTask);
    const words: Array<string> = await c.req.json();
    if (!words || !Array.isArray(words)) return emptyResponse(STATUS_CODE.BadRequest);
    for (const word of words) serverTasks.delete(word);
    const deleteResult = await collectionTask.deleteMany({ word: { $in: words } });
    console.log(`API task DELETE ${username} with tasks ${deleteResult.deletedCount}.`);
    return jsonResponse(deleteResult);
}).put(user, auth, async (c) => {
    const username = c.get('username');
    const collectionTask = getCollectionTask(username);
    const serverTasks = await syncTasks(username, collectionTask);
    const ctask: ITask = await c.req.json();
    if (!ctask) return emptyResponse(STATUS_CODE.BadRequest);
    upsertTask(ctask, serverTasks, collectionTask);
    console.log(`API task PUT ${username} with task ${ctask.word}.`);
    return emptyResponse();
})

export default app;