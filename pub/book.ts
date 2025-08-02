import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { collectionBook } from "../lib/mongo.ts";
import { minio } from "../lib/minio.ts";
import { B2_BUCKET } from "@sholvoir/memword-common/common";

const app = new Hono();

app.get(async (c) => {
    console.log(`API book GET`);
    const books = []
    for await (const book of collectionBook.find())
        books.push(book)
    return c.json(books);
}).get(":u/:b", async (c) => {
    const {u, b} = c.req.param();
    const bid = `${u}/${b}`;
    console.log(`API book:${bid} GET`);
    const book = await collectionBook.findOne({bid: `${bid}`});
    if (!book) return emptyResponse(STATUS_CODE.NotFound);
    const stream = await minio.getObject(B2_BUCKET, `${book.bid}.txt`);
    return new Response(stream, { headers: { version: `${book.version}`}});
});

export default app;