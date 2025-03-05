import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/deno';
import jwt from './mid/jwt.ts';
import admin from './mid/admin.ts';

import signup from "./pub/signup.ts";
import signin from "./pub/signin.ts";
import otp from "./pub/otp.ts";
import sound from "./pub/sound.ts";
import vocabulary from "./pub/vocabulary.ts"
import pub_dict from "./pub/dict.ts";
import pub_wordlist from "./pub/wordlist.ts";

import task from './auth/task.ts';
import renew from './auth/renew.ts';
import issue from './auth/issue.ts';
import setting from './auth/setting.ts';
import auth_wordlist from "./auth/wordlist.ts";

import admin_dict from "./admin/dict.ts";
import admin_wordlist from "./admin/wordlist.ts";

import { connect } from './lib/mongo.ts';

const run = async () => {
    const app = new Hono();
    app.use(cors());
    app.use(serveStatic({root: './static/'}));

    app.route('/pub/signup', signup);
    app.route('/pub/signin', signin);
    app.route('/pub/otp', otp);
    app.route('/pub/sound', sound);
    app.route('/pub/vocabulary', vocabulary);
    app.route('/pub/dict', pub_dict);
    app.route('/pub/wordlist', pub_wordlist);

    app.use('/api/*', jwt);
    app.route('/api/task', task);
    app.route('/api/renew', renew);
    app.route('/api/issue', issue);
    app.route('/api/setting', setting);
    app.route('/api/wordlist', auth_wordlist);

    app.use('/admin/*', jwt, admin);
    app.route('/admin/dict', admin_dict);
    app.route('/admin/wordlist', admin_wordlist);

    await connect();

    Deno.serve(app.fetch);
}

if (import.meta.main) run();