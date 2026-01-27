import { maxAge } from "@sholvoir/memword-common/common";
import { Hono } from "hono";
import type { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";
import auth from "../mid/auth.ts";
import user from "../mid/user.ts";

const app = new Hono<jwtEnv>();

app.post(user, auth, async (c) => {
   const name = c.get("username");
   console.log(`API renew POST ${name}`);
   return c.json({ auth: await jwt.createToken(maxAge, { aud: name }) });
});

export default app;
