import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';
import fill from '../lib/oxford.ts';

const app = new Hono();

app.get(async (c) => {
    const id = c.req.query('q');
    if (!id) return emptyResponse(STATUS_CODE.BadRequest);
    const card = await fill(id, {}, id);
    console.log(`API 'definition' GET id: ${id}`);
    return c.json(card);
});

export default app;