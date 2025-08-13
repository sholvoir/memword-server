import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/deno';
import user from './mid/user.ts';
import auth from './mid/auth.ts';
import admin from './mid/admin.ts';
import cookie from './mid/cookie.ts';

import pub_signup from "./pub/signup.ts";
import pub_signin from "./pub/signin.ts";
import pub_otp from "./pub/otp.ts";
import pub_sound from "./pub/sound.ts";
import pub_book from "./pub/book.ts";
import pub_definition from "./pub/definition.ts";

import auth_task from './auth/task.ts';
import auth_renew from './auth/renew.ts';
import auth_setting from './auth/setting.ts';
import auth_book from "./auth/book.ts";

import ecdictAsIssue from './api/ecdict-as-issue.ts';

import { connect } from './lib/mongo.ts';
import dict from "./api/dict.ts";
import issue from "./api/issue.ts";
import vocabulary from "./api/vocabulary.ts";


const run = async () => {
    const app = new Hono();
    app.use(cors());
    app.use('*', serveStatic({ root: './html/static/' }));
    app.get('/', user, cookie, serveStatic({ path:'./html/index.html' }));
    app.get('/admin', user, auth, cookie, serveStatic({ path: './html/admin.html' }));

    app.route('/api/v2/dict', dict);
    app.route('/api/v2/issue', issue);
    app.route('/api/v2/vocabulty', vocabulary);
    app.route('/api/v2/ecdict-as-issue', ecdictAsIssue);

    app.route('/pub/signup', pub_signup);
    app.route('/pub/signin', pub_signin);
    app.route('/pub/otp', pub_otp);
    app.route('/pub/sound', pub_sound);
    app.route('/pub/book', pub_book);
    app.route('/pub/definition', pub_definition);

    app.use('/api/v1/*', user, auth);
    app.route('/api/v1/task', auth_task);
    app.route('/api/v1/renew', auth_renew);
    app.route('/api/v1/setting', auth_setting);
    app.route('/api/v1/book', auth_book);

    app.use('/admin/*', user, auth, admin);

    await connect();

    Deno.serve(app.fetch);
}

if (import.meta.main) run();