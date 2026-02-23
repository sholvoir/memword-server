import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";
import auth from "../mid/auth.ts";

const maxAge = 60 * 60 * 24;
const app = new Hono<jwtEnv>();

app.get(auth, async (c) => {
   const username = c.get("username");
   console.log(`API token GET ${username}`);
   const token = await jwt.createToken(maxAge, { aud: username });
   return c.json({ token });
});

export default app;
