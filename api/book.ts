import { getHash } from "@sholvoir/generic/hash";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import type { IBook } from "@sholvoir/memword-common/ibook";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import { collectionBook } from "../lib/mongo.ts";
import { deleteObject, getObject, putObject } from "../lib/s3.ts";
import * as spellCheck from "../lib/spell-check.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();
app.get(auth, async (c) => {
   console.log(`API book GET`);
   const books: Array<IBook> = [];
   const username = c.get("username");
   if (!username) return c.json(books);
   for await (const book of collectionBook.find({
      $or: [{ bid: { $regex: `^${username}/` } }, { public: true }],
   })) {
      delete (book as IBook)._id;
      books.push(book);
   }
   return c.json(books);
})
   .post(auth, async (c) => {
      const username = c.get("username");
      const bname = c.req.query("name");
      let disc = c.req.query("disc");
      if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${bname}`;
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      const [words, replaces] = await spellCheck.check(text.split("\n"));
      if (Object.keys(replaces).length) {
         console.log(`API book POST ${bid}, spell check failed.`);
         return c.json(replaces, STATUS_CODE.NotAcceptable);
      }
      const book = await collectionBook.findOne({ bid });
      if (book) {
         if (!disc) disc = book.disc;
         const text = await getObject(`${bid}.txt`);
         for (let line of text.split("\n"))
            if ((line = line.trim())) words.add(line);
      }
      const data = Array.from(words).sort().join("\n");
      const checksum = await getHash(data);
      await putObject(`${bid}.txt`, data);
      await collectionBook.updateOne(
         { bid },
         { $set: { checksum, disc } },
         { upsert: true },
      );
      console.log(`API book POST ${bid}, successed.`);
      return c.json({ bid, checksum, disc });
   })
   .put(auth, async (c) => {
      const username = c.get("username");
      const bname = c.req.query("name");
      const disc = c.req.query("disc");
      if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${bname}`;
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      const [words, replaces] = await spellCheck.check(text.split("\n"));
      if (Object.keys(replaces).length) {
         console.log(`API book PUT ${bid}, spell check failed.`);
         return c.json(replaces, STATUS_CODE.NotAcceptable);
      }
      const data = Array.from(words).sort().join("\n");
      const checksum = await getHash(data);
      await putObject(`${bid}.txt`, data);
      await collectionBook.updateOne(
         { bid },
         { $set: disc ? { checksum, disc } : { checksum } },
         { upsert: true },
      );
      console.log(`API book PUT ${bid}, successed.`);
      return c.json({ bid, checksum, disc });
   })
   .delete(auth, async (c) => {
      const username = c.get("username");
      const bname = c.req.query("name");
      if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${bname}`;
      const book = await collectionBook.findOne({ bid });
      if (!book) return emptyResponse(STATUS_CODE.NotFound);
      const result = await collectionBook.deleteOne({ bid });
      if (!result.acknowledged) return c.json(result, STATUS_CODE.Conflict);
      await deleteObject(`${bid}.txt`);
      console.log(`API book DELETE ${username}/${bname}, successed.`);
      return emptyResponse();
   })
   .get(":u/:b", auth, async (c) => {
      const username = c.get("username");
      const { u: uname, b: bname } = c.req.param();
      const bid = `${uname}/${bname}`;
      console.log(`API book:${bid} GET`);
      const book = await collectionBook.findOne({ bid: `${bid}` });
      if (!book) return emptyResponse(STATUS_CODE.NotFound);
      if (username === uname || book.public) {
         const text = await getObject(`${book.bid}.txt`);
         return new Response(text, {
            headers: { checksum: `${book.checksum}` },
         });
      }
      return emptyResponse(STATUS_CODE.Forbidden);
   });

export default app;
