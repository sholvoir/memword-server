import { Hono } from "hono";
import { maxAge } from "@sholvoir/memword-common/common";
import { jwtEnv } from "../lib/env.ts";
import { jwt } from "../lib/jwt.ts";

const app = new Hono<jwtEnv>()

app.post(async (c) => {
    const name = c.get('username');
    console.log(`API renew POST ${name}`);
    return c.json({ auth: await jwt.createToken(maxAge, { aud: name }) });
});

export default app;