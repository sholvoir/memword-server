import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';
import { IDict } from "@sholvoir/memword-common/idict";
import { IUser } from "@sholvoir/memword-common/iuser";
import { IBook } from "@sholvoir/memword-common/ibook";
import { ITask } from "@sholvoir/memword-common/itask";
import { IIssue } from "@sholvoir/memword-common/iissue";

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
export const collectionIssue = memwordDB.collection<IIssue>('issue');
export const collectionBook = memwordDB.collection<IBook>('book');

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