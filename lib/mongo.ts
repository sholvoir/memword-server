import { MongoClient, ServerApiVersion } from 'npm:mongodb@^6.12.0';
import { IDict } from "./idict.ts";
import { IUser } from "./iuser.ts";
import { IWordList } from "./wordlist.ts";

const client = new MongoClient(Deno.env.get('MONGO_URI')!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

await client.connect();

export const taskDB = client.db('task');
export const collectionDict = client.db('dict').collection<IDict>('dict');
export const collectionUser = client.db('user').collection<IUser>('user');
export const collectionWordList = client.db('wordlist').collection<IWordList>('wordlist');
