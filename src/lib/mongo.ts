import type { IIssue } from "@sholvoir/dict-server/lib/iissue.ts";
import { MongoClient, ServerApiVersion } from "mongodb";
// import type { IAchieve } from "./iachieve.ts";
import type { IBook } from "./ibook.ts";
import type { ICard } from "./icard.ts";
import type { ITask } from "./itask.ts";
import type { IUser } from "./iuser.ts";

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

const dictDB = client.db("dict");
export const dictIssue = dictDB.collection<IIssue>("issue");

const memwordDB = client.db("memword");

export const collectionSys = memwordDB.collection<kv>("sys");
export const collectionUser = memwordDB.collection<IUser>("user");
export const collectionBook = memwordDB.collection<IBook>("book");
export const collectionIssue = memwordDB.collection<IIssue>("issue");

export const getCollectionTask = (username: string) =>
   memwordDB.collection<ITask>(`_${username}`);
// export const getCollectionAchieve = (username: string) =>
//    memwordDB.collection<IAchieve>(`_${username}_achieve`);
export const getCollectionCard = (username: string) =>
   memwordDB.collection<ICard>(`_${username}_card`);

export const initForNewUser = async (username: string) => {
   const taskName = `_${username}`;
   // const achieveName = `_${username}_achieve`;
   const cardName = `_${username}_card`;
   const collectionNames = (await memwordDB.collections()).map(
      (conn) => conn.collectionName,
   );
   if (!collectionNames.includes(taskName)) {
      const collection = await memwordDB.createCollection(taskName);
      await collection.createIndex({ word: 1 }, { unique: true });
   }
   // if (!collectionNames.includes(achieveName)) {
   //    const collection = await memwordDB.createCollection(achieveName);
   //    await collection.createIndex({ word: 1 }, { unique: true });
   // }
   if (!collectionNames.includes(cardName)) {
      const collection = await memwordDB.createCollection(cardName);
      await collection.createIndex({ page: 1 }, { unique: true });
   }
};
