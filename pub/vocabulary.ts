import { Hono } from "hono";
import { getVocabulary } from "../lib/spell-check.ts";

const app = new Hono();

app.get(async c => c.json(Array.from(await getVocabulary()).sort()));

export default app;