import { Hono } from "hono";
import { emptyResponse, STATUS_CODE } from '@sholvoir/generic/http';

const defaultAgent = 'Thunder Client (https://www.thunderclient.com)';
const app = new Hono();

app.get(async (c) => {
    try {
        const soundUrl = c.req.query('q');
        if (!soundUrl) return emptyResponse(STATUS_CODE.BadRequest);
        const reqInit = { headers: { 'User-Agent': c.req.header('User-Agent') ?? defaultAgent} }
        const resp = await fetch(soundUrl, reqInit);
        if (!resp.ok) return emptyResponse(STATUS_CODE.NotFound);
        const headers = new Headers();
        resp.headers.forEach((value, key) => headers.set(key, value));
        headers.set('Cache-Control', 'public, max-age=31536000');
        return new Response(resp.body, { headers });
    } catch (e) {
        console.error(e);
        return emptyResponse(STATUS_CODE.InternalServerError);
    }
});

export default app;