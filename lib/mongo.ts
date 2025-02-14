import { MongoClient, ServerApiVersion } from 'npm:mongodb@^6.12.0';
import { IDict } from "./idict.ts";
import { IUser } from "./iuser.ts";
import { IWordList } from "./iwordlist.ts";

export const client = new MongoClient(Deno.env.get('MONGO_URI')!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

export const memwordDB = client.db('memword');
export const collectionDict = memwordDB.collection<IDict>('dict');
export const collectionUser = memwordDB.collection<IUser>('user');
export const collectionWordList = memwordDB.collection<IWordList>('wordlist');
