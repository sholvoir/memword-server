import { getHash } from "@sholvoir/generic/hash";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { S3 } from "@sholvoir/generic/s3";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import type { IBook } from "../lib/ibook.ts";
import { collectionBook } from "../lib/mongo.ts";
import auth from "../mid/auth.ts";

const s3 = new S3(
   "https://s3.us-east-005.backblazeb2.com",
   "us-east-005",
   Deno.env.get("BACKBLAZE_KEY_ID")!,
   Deno.env.get("BACKBLAZE_APP_KEY")!,
   "vocabulary",
);

const DICT_API_BASE = Deno.env.get("DEBUG")
   ? "http://localhost:8080/api/v2"
   : "https://dict.micinfotech.com/api/v2";

const app = new Hono<jwtEnv>();
app.get(auth, async (c) => {
   console.log(`API book GET`);
   const books: Array<IBook> = [];
   const username = c.get("username");
   if (!username) return c.json(books);
   for await (const book of collectionBook.find(
      {
         $or: [{ bid: { $regex: `^${username}/` } }, { public: true }],
      },
      { projection: { _id: 0 } },
   ))
      books.push(book);
   return c.json(books);
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
      await s3.deleteObject(`${bid}.txt`);
      console.log(`API book DELETE ${username}/${bname}, successed.`);
      return emptyResponse();
   })
   .on(["POST", "PUT"], "/", auth, async (c) => {
      const username = c.get("username");
      const bname = c.req.query("name");
      let disc = c.req.query("disc");
      const isPublic = c.req.query("public");
      if (!bname) return emptyResponse(STATUS_CODE.BadRequest);
      const bid = `${username}/${bname}`;
      const text = await c.req.text();
      if (!text.length) return emptyResponse(STATUS_CODE.BadRequest);
      // spell check
      const res = await fetch(`${DICT_API_BASE}/spell-check`, {
         method: "POST",
         body: text,
      });
      if (res.status === STATUS_CODE.NotAcceptable) {
         console.log(`API book POST ${bid}, spell check failed.`);
         return res;
      }
      if (res.status !== STATUS_CODE.OK) {
         console.log(`API book POST ${bid}, Dict server error.`);
         return emptyResponse(STATUS_CODE.InternalServerError);
      }
      const words = new Set<string>();
      for (let line of text.split("\n"))
         if ((line = line.trim())) words.add(line);
      if (c.req.method === "POST") {
         const book = await collectionBook.findOne({ bid });
         if (book) {
            if (!disc) disc = book.disc;
            book.public = !!isPublic;
            const text = await s3.getTextObject(`${bid}.txt`);
            for (let line of text.split("\n"))
               if ((line = line.trim())) words.add(line);
         }
      }
      const data = Array.from(words).sort().join("\n");
      const checksum = await getHash(data);
      await s3.putTextObject(`${bid}.txt`, data);
      await collectionBook.updateOne(
         { bid },
         { $set: { checksum, disc, public: !!isPublic } },
         { upsert: true },
      );
      console.log(`API book POST ${bid}, successed.`);
      return c.json({ bid, checksum, disc, public: !!isPublic });
   })
   .get(":u/:b", auth, async (c) => {
      const username = c.get("username");
      const { u: uname, b: bname } = c.req.param();
      const bid = `${uname}/${bname}`;
      console.log(`API book:${bid} GET`);
      const book = await collectionBook.findOne({ bid: `${bid}` });
      if (!book) return emptyResponse(STATUS_CODE.NotFound);
      if (username === uname || book.public) {
         const text = await s3.getTextObject(`${book.bid}.txt`);
         return new Response(text, {
            headers: { checksum: `${book.checksum}` },
         });
      }
      return emptyResponse(STATUS_CODE.Forbidden);
   });

export default app;
