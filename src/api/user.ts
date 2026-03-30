import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import auth from "../mid/auth.ts";

export default new Hono<jwtEnv>().get(auth, (c) => {
   const username = c.get("username");
   console.log(`API user GET ${username}`);
   return c.json({ name: username });
});
