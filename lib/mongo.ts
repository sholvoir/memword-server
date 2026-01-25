import type { IBook } from "@sholvoir/memword-common/ibook";
import type { IDict } from "@sholvoir/memword-common/idict";
import type { IIssue } from "@sholvoir/memword-common/iissue";
import type { ITask } from "@sholvoir/memword-common/itask";
import type { IUser } from "@sholvoir/memword-common/iuser";
import { MongoClient, ServerApiVersion } from "mongodb";

type kv = { key: string; value: string };

const client = new MongoClient(Deno.env.get("MONGO_URI")!, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});

export const connect = () => client.connect();
export const close = () => client.close();

const memwordDB = client.db("memword");

export const collectionSys = memwordDB.collection<kv>("sys");
export const collectionDict = memwordDB.collection<IDict>("dict");
export const collectionUser = memwordDB.collection<IUser>("user");
export const collectionIssue = memwordDB.collection<IIssue>("issue");
export const collectionBook = memwordDB.collection<IBook>("book");

export const getCollectionTask = (username: string) =>
   memwordDB.collection<ITask>(`_${username}`);

export const newTaskCollection = async (username: string) => {
   const taskName = `_${username}`;
   const collNames = (await memwordDB.collections()).map(
      (conn) => conn.collectionName,
   );
   if (!collNames.includes(taskName)) {
      const collection = await memwordDB.createCollection(taskName);
      await collection.createIndex({ word: 1 }, { unique: true });
   }
};
