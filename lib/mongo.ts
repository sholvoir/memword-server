import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';
import { IDict } from "./idict.ts";
import { IUser } from "./iuser.ts";
import { IWordList } from "./iwordlist.ts";
import { ITask } from "./itask.ts";

const options = { serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
}} as MongoClientOptions;
const client = new MongoClient(Deno.env.get('MONGO_URI')!, options);

export const connect = () => client.connect();
export const close = () => client.close();

const memwordDB = client.db('memword');

export const collectionDict = memwordDB.collection<IDict>('dict');
export const collectionUser = memwordDB.collection<IUser>('user');
export const collectionWordList = memwordDB.collection<IWordList>('wordlist');

export const getCollectionTask = (username: string) => memwordDB.collection<ITask>(`_${username}`);

export const newTaskCollection = async (username: string) => {
    const taskName = `_${username}`;
    const collNames = (await memwordDB.collections()).map(conn => conn.collectionName);
    if (!collNames.includes(taskName)) {
        const collection = await memwordDB.createCollection(taskName);
        await collection.createIndex({ word: 1 }, { unique: true });
        await collection.createIndex({ last: 1 });
    }
}