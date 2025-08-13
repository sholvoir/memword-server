import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/deno';
import jwt from './mid/jwt.ts';
import admin from './mid/admin.ts';

import pub_signup from "./pub/signup.ts";
import pub_signin from "./pub/signin.ts";
import pub_otp from "./pub/otp.ts";
import pub_sound from "./pub/sound.ts";
import pub_dict from "./pub/dict.ts";
import pub_book from "./pub/book.ts";
import pub_vocabulary from "./pub/vocabulary.ts";
import pub_definition from "./pub/definition.ts";

import auth_task from './auth/task.ts';
import auth_renew from './auth/renew.ts';
import auth_issue from './auth/issue.ts';
import auth_setting from './auth/setting.ts';
import auth_book from "./auth/book.ts";

import admin_dict from "./admin/dict.ts";
import admin_issue from "./admin/issue.ts";
import admin_vocabulary from "./admin/vocabulary.ts";

import ecdictAsIssue from './api/ecdict-as-issue.ts';

import { connect } from './lib/mongo.ts';

const run = async () => {
    const app = new Hono();
    app.use(cors());
    app.use(serveStatic({ root: './html/static/' }));
    app.use('/assets/*', serveStatic({ root: './html/assets/' }));
    app.get('/', serveStatic({ path:'./html/index.html' }));
    app.get('/admin', serveStatic({ path: './html/admin.html' }));

    app.route('/api/v2/ecdict-as-issue', ecdictAsIssue);

    app.route('/pub/signup', pub_signup);
    app.route('/pub/signin', pub_signin);
    app.route('/pub/otp', pub_otp);
    app.route('/pub/sound', pub_sound);
    app.route('/pub/dict', pub_dict);
    app.route('/pub/book', pub_book);
    app.route('/pub/vocabulary', pub_vocabulary);
    app.route('/pub/definition', pub_definition);

    app.use('/api/v1/*', jwt);
    app.route('/api/v1/task', auth_task);
    app.route('/api/v1/renew', auth_renew);
    app.route('/api/v1/setting', auth_setting);
    app.route('/api/v1/issue', auth_issue);
    app.route('/api/v1/book', auth_book);

    app.use('/admin/*', jwt, admin);
    app.route('/admin/dict', admin_dict);
    app.route('/admin/issue', admin_issue);
    app.route('/admin/vocabulary', admin_vocabulary);

    await connect();

    Deno.serve(app.fetch);
}

if (import.meta.main) run();