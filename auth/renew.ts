import { Hono } from "hono";
import { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";
import { maxAge } from "../lib/common.ts";

const app = new Hono<jwtEnv>()

app.post(async (c) => {
    const name = c.get('username');
    console.log(`API '/renew' POST ${name}`);
    return c.json({ auth: await jwt.createToken(maxAge, { aud: name }) });
});

export default app;