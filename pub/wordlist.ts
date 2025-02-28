import { Hono } from "hono";
import { collectionWordList } from "../lib/mongo.ts";

const app = new Hono();

app.get(async (c) => {
    const wls = []
    for await (const wl of collectionWordList.find())
        wls.push(wl)
    console.log(`API wordlist GET`);
    return c.json(wls);
});

export default app;