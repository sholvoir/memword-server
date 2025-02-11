import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from "@sholvoir/generic/http";
import { sendEmail } from "../lib/email.ts";
import { jwtEnv } from "../lib/env.ts";

const app = new Hono<jwtEnv>()

app.post(async (c) => {
    const name = c.get('username');
    const issue = (await c.req.json()).issue;
    if (!issue) return emptyResponse(STATUS_CODE.BadRequest);
    console.log(`API '/issue' POST ${name}`);
    return await sendEmail({
        from: 'MEMWORD <memword.sholvoir@gmail.com>',
        to: 'sovar.he@gmail.com',
        subject: `Issue Report from ${name}`,
        content: issue
    });
});

export default app;