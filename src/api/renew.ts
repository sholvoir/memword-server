import { emptyResponse } from "@sholvoir/generic/http";
import { Hono } from "hono";
import { setAuthCookie } from "../lib/cookie.ts";
import type { jwtEnv } from "../lib/env.ts";
import auth from "../mid/auth.ts";

const app = new Hono<jwtEnv>();

app.get(auth, async (c) => {
   const name = c.get("username");
   console.log(`API renew GET ${name}`);
   await setAuthCookie(c, name);
   return emptyResponse();
});

export default app;
