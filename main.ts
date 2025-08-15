import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { connect } from './lib/mongo.ts';
import html from './api/static.ts';
import otp from "./api/otp.ts";
import dict from "./api/dict.ts";
import book from "./api/book.ts";
import task from "./api/task.ts";
import renew from "./api/renew.ts";
import sound from "./api/sound.ts";
import issue from "./api/issue.ts";
import signup from "./api/signup.ts";
import signin from "./api/signin.ts";
import setting from "./api/setting.ts";
import definition from "./api/definition.ts";
import vocabulary from "./api/vocabulary.ts";
import ecdictAsIssue from './api/ecdict-as-issue.ts';

const run = async () => {
    const app = new Hono();
    app.use(cors());
    html(app);

    app.route('/api/v2/otp', otp);
    app.route('/api/v2/dict', dict);
    app.route('/api/v2/book', book);
    app.route('/api/v2/task', task);
    app.route('/api/v2/renew', renew);
    app.route('/api/v2/sound', sound);
    app.route('/api/v2/issue', issue);
    app.route('/api/v2/signup', signup);
    app.route('/api/v2/signin', signin);
    app.route('/api/v2/setting', setting);
    app.route('/api/v2/definition', definition);
    app.route('/api/v2/vocabulary', vocabulary);
    app.route('/api/v2/ecdict-as-issue', ecdictAsIssue);

    await connect();
    Deno.serve(app.fetch);
}

if (import.meta.main) run();