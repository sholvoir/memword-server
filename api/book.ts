import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { now } from "@sholvoir/memword-common/common";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import { collectionBook } from "../lib/mongo.ts";
import { deleteObject, getObject, putObject } from "../lib/s3.ts";
import * as spellCheck from "../lib/spell-check.ts";
import auth from "../mid/auth.ts";
import user from "../mid/user.ts";

const app = new Hono<jwtEnv>();
app.get(async (c) => {
   console.log(`API book GET`);
   const books = [];
   for await (const book of collectionBook.find()) books.push(book);
   return c.json(books);
})
   .post(user, auth, async (c) => {
      const username = c.get("username");
      const bname = c.req.query("name");
      let disc = c.req.query("disc");
      if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${bname}`;
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      const version = now();
      const [words, replaces] = await spellCheck.check(text.split("\n"));
      if (Object.keys(replaces).length) {
         console.log(`API book POST ${bid}, spell check failed.`);
         return c.json(replaces, STATUS_CODE.NotAcceptable);
      }
      const book = await collectionBook.findOne({ bid });
      if (book) {
         if (!disc) disc = book.disc;
         await collectionBook.updateOne({ bid }, { $set: book });
         const text = await getObject(`${bid}.txt`);
         for (let line of text.split("\n"))
            if ((line = line.trim())) words.add(line);
      }
      await putObject(`${bid}.txt`, Array.from(words).sort().join("\n"));
      if (book)
         await collectionBook.updateOne({ bid }, { $set: { version, disc } });
      else await collectionBook.insertOne({ bid, version, disc });
      console.log(`API book POST ${bid}, successed.`);
      return c.json({ bid, version, disc });
   })
   .put(user, auth, async (c) => {
      const username = c.get("username");
      const bname = c.req.query("name");
      const disc = c.req.query("disc");
      if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${bname}`;
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      const version = now();
      const [words, replaces] = await spellCheck.check(text.split("\n"));
      if (Object.keys(replaces).length) {
         console.log(`API book PUT ${bid}, spell check failed.`);
         return c.json(replaces, STATUS_CODE.NotAcceptable);
      }
      const wl = await collectionBook.findOne({ bid });
      await putObject(`${bid}.txt`, Array.from(words).sort().join("\n"));
      if (wl)
         await collectionBook.updateOne(
            { bid },
            { $set: disc ? { version, disc } : { version } },
         );
      else
         await collectionBook.insertOne(
            disc ? { bid, version, disc } : { bid, version },
         );
      console.log(`API book PUT ${bid}, successed.`);
      return c.json({ bid, version, disc });
   })
   .delete(user, auth, async (c) => {
      const username = c.get("username");
      const wlname = c.req.query("name");
      if (!wlname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${wlname}`;
      const book = await collectionBook.findOne({ bid });
      if (!book) return emptyResponse(STATUS_CODE.NotFound);
      const result = await collectionBook.deleteOne({ bid });
      if (!result.acknowledged) return c.json(result, STATUS_CODE.Conflict);
      await deleteObject(`${bid}.txt`);
      console.log(`API book DELETE ${username}/${wlname}, successed.`);
      return emptyResponse();
   })
   .get(":u/:b", async (c) => {
      const { u, b } = c.req.param();
      const bid = `${u}/${b}`;
      console.log(`API book:${bid} GET`);
      const book = await collectionBook.findOne({ bid: `${bid}` });
      if (!book) return emptyResponse(STATUS_CODE.NotFound);
      const text = await getObject(`${book.bid}.txt`);
      return new Response(text, { headers: { version: `${book.version}` } });
   });

export default app;
