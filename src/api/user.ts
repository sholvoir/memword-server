import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();

app.get(auth, async (c) => {
   const username = c.get("username");
   console.log(`API user GET ${username}`);
   return c.json({ name: username });
});

export default app;
