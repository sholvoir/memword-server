import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import user from '../mid/user.ts';
import { setCookie } from "hono/cookie";
import { jwt } from "../lib/jwt.ts";
import { maxAge } from "@sholvoir/memword-common/common";

const admin = Deno.env.get('ADMIN')!;

const use = (app: Hono) => {
    app.use('*', serveStatic({ root: './static/' }));
    app.get('/', user, async (c, next) => {
        console.log('index');
        const aud = c.get('username');
        if (!aud) return c.redirect('/about');
        await next();
        setCookie(c, 'auth', await jwt.createToken(maxAge, { aud }), { maxAge });
    }, serveStatic({ path: './html/index.html' }));
    app.get('/about', async (_, next) => {
        console.log('about');
        await next();
    }, serveStatic({ path: './html/about.html' }));
    app.get('/admin', user, async (c, next) => {
        const aud = c.get('username');
        if (!aud || aud !== admin) return c.redirect('/about');
        await next();
        setCookie(c, 'auth', await jwt.createToken(maxAge, { aud }), { maxAge });
    }, serveStatic({ path: './html/admin.html' }));
}

export default use;